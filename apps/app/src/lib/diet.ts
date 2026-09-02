// Turns the diet markdown from `GET /reports/{id}` into the labelled cells the
// redesign's plan page renders as a grid (docs/redesign/output page redesign.png,
// "02 Direction — here's your diet").
//
// This is a parser rather than a backend schema change because the shape is
// already contracted: strengthiva-backend's DIET_PROMPT instructs the model to
// emit `**[Meal Slot Name]**` followed by `- Option A/B/C: …` bullets, across a
// known slot list (Early Morning, Breakfast, Mid-Morning, Lunch, Evening Snack,
// Dinner, Before Bed). So the structure is there; it just arrives as text.
//
// It is still an LLM, so nothing here assumes compliance. Any heading with
// bullets under it becomes a slot, whatever it's called, and the caller is
// expected to fall back to rendering the raw markdown when this returns null —
// a half-parsed diet plan is worse than a plain one.
//
// ── Supportive text ─────────────────────────────────────────────────────────
// The structured diet JSON carries two kinds of non-food text, and both used to
// render as if they were food:
//
//   * Per-meal notes — `{label, text}` on each meal, where label is one of
//     Benefits / Purpose / Focus / Properties / Nutrition focus. These explain
//     why that meal is what it is, and belong INSIDE that meal's cell.
//   * Chart-level doctor tips — day-wide advice (including yoga and pranayama),
//     not tied to any single meal.
//
// Both arrive as ordinary bullets, so a "Benefits: …" line was rendering with a
// food dot next to the actual food. `notes` separates them out by their leading
// label, which is data-driven — those labels come from the source JSON, not from
// asking the model to invent syntax it may not follow.

export type DietSlot = {
  /** The heading as written, brackets and bold markers stripped. */
  label: string;
  /** Bullet text, with any "Option A:" prefix removed. Food only. */
  items: string[];
  /** Supportive lines (Benefits/Purpose/Focus/…) that belong to this meal. */
  notes: string[];
};

export type ParsedDiet = {
  /** Meal slots only — the grid cells. */
  slots: DietSlot[];
  /**
   * Day-wide advice: the `[Objective]` and `[Doctor Tips]` sections. Kept out of
   * `slots` on purpose — they are not meals, and rendering them as equal grid
   * cells made day-wide advice look like a course of the meal plan.
   */
  advice: DietSlot[];
  /** Anything trailing the last slot — DIET_PROMPT allows a BMI/demographic note. */
  note: string | null;
};

/** `**[Breakfast]**`, `**Breakfast**`, `### Breakfast` → "Breakfast" */
const HEADING = /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*\[?([^\]*#][^\]*]*?)\]?\s*(?:\*\*)?\s*:?\s*$/;
const BULLET = /^\s*[-*•]\s+(.*\S)\s*$/;
/** "Option A: 150 ml water" → "150 ml water"; also "A) …" and "1. …" */
const OPTION_PREFIX = /^(?:option\s+)?[a-z0-9]{1,2}\s*[):.-]\s*/i;

/**
 * Labels the structured JSON actually uses on per-meal notes, plus the ones the
 * prompt asks for by name. Matched case-insensitively at the start of a bullet.
 * Anything else stays a food item — the failure direction matters: a stray note
 * rendered as food is untidy, but hiding a real food line would be wrong.
 */
const NOTE_LABEL =
  /^\s*(?:\*\*|_|\*)?\s*(benefits?|purpose|focus|nutrition focus|properties|note|notes|why|tip|tips)\s*(?:\*\*|_|\*)?\s*[:—-]\s*/i;

/**
 * The non-vegetarian alternative bullet the backend adds for non-veg patients
 * (strengthiva-backend NONVEG_AUGMENTATION_CLAUSE): a macro-matched meat/fish/egg
 * swap shown beneath the vegetarian item, e.g.
 *   "Non-veg option: Grilled chicken breast (100g) — ~165 kcal, ~31 g protein
 *    (vs paneer bhurji: ~265 kcal, ~25 g protein)"
 *
 * This is FOOD, not supporting text — but it is recognised explicitly (rather than
 * left to fall through as an ordinary item) for two reasons: so the UI can mark it
 * as an alternative, and so it can never be misclassified as a note if NOTE_LABEL
 * ever grows a colliding word. Tolerant of the wording drift the model shows
 * ("Non veg alternative", "Nonvegetarian swap"); kept in lockstep with the
 * backend's `_NONVEG_OPTION_LINE` regex — change both together.
 */
const NONVEG_LABEL = /^\s*non[-\s]?veg(?:etarian)?\s+(?:option|alternative|swap)\b\s*[:—-]?\s*/i;

/** Headings that are day-wide advice rather than a meal. */
const ADVICE_HEADING = /^(objective|goal|doctor'?s? tips?|main properties|day calories)$/i;

/**
 * Below this many slots the output clearly didn't follow the prompt, and a grid
 * built from one or two fragments misrepresents the plan. Callers render the
 * markdown instead. Counted on MEAL slots only — an answer that produced just
 * Objective and Doctor Tips has no plan in it, whatever the section count says.
 */
const MIN_SLOTS = 3;

/** Strip a leading supportive label so the UI can style it rather than repeat it. */
export function stripNoteLabel(line: string): { label: string | null; text: string } {
  const m = line.match(NOTE_LABEL);
  if (!m) return { label: null, text: line };
  return {
    label: m[1].replace(/^\w/, (c) => c.toUpperCase()),
    text: line.slice(m[0].length).trim(),
  };
}

/**
 * Yoga, asana and pranayama lines get their own marker in the UI.
 *
 * `asana` is matched as a SUFFIX, not a whole word: the corpus names poses
 * (Vajrasana, Padmasana, Shavasana), so a leading word boundary missed almost
 * every real one. Surya Namaskar is named explicitly — it is yoga with no
 * "asana" in it.
 */
export function isYogaLine(text: string): boolean {
  return /\byoga\b|\bpranayam|asana\b|\baasan|surya\s*namaskar/i.test(text);
}

/** True for a non-vegetarian alternative food item (see NONVEG_LABEL). */
export function isNonVegAlternative(text: string): boolean {
  return NONVEG_LABEL.test(text);
}

/**
 * Split a non-veg alternative item into a badge flag and its food text (label
 * prefix removed), so the UI can tag it rather than repeat "Non-veg option:".
 * A non-matching line is returned unchanged with `isNonVeg: false`.
 */
export function stripNonVegLabel(text: string): { isNonVeg: boolean; text: string } {
  const m = text.match(NONVEG_LABEL);
  if (!m) return { isNonVeg: false, text };
  return { isNonVeg: true, text: text.slice(m[0].length).trim() };
}

export function parseDietPlan(markdown: string): ParsedDiet | null {
  if (!markdown?.trim()) return null;

  const lines = markdown.split("\n");
  const sections: DietSlot[] = [];
  const trailing: string[] = [];
  let current: DietSlot | null = null;

  const flush = () => {
    if (current && (current.items.length || current.notes.length)) sections.push(current);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const bullet = line.match(BULLET);
    if (bullet && current) {
      const body = bullet[1].trim();
      // The non-veg alternative is FOOD: pin it as an item before the note check,
      // so it renders in the meal (with its badge) and can never be swallowed as
      // supporting text. Its "Non-veg option:" prefix isn't an OPTION_PREFIX, so it
      // is kept intact for stripNonVegLabel to split at render time.
      if (isNonVegAlternative(body)) current.items.push(body);
      // Checked BEFORE the option prefix is stripped: "Benefits: …" has no
      // option prefix, and stripping first can eat the first word of a note.
      else if (NOTE_LABEL.test(body)) current.notes.push(body);
      else current.items.push(body.replace(OPTION_PREFIX, "").trim());
      continue;
    }

    // A heading only counts once we know it has bullets under it, so the
    // document title ("**Personalised Single-Day Diet Plan for Mansi**") and any
    // closing prose don't become empty cells.
    const heading = line.match(HEADING);
    const looksLikeHeading =
      heading && (line.startsWith("**") || line.startsWith("#") || line.startsWith("["));

    if (looksLikeHeading) {
      flush();
      current = { label: heading[1].trim(), items: [], notes: [] };
      continue;
    }

    // Plain prose. Before any section it's the title; after them it's the note.
    if (sections.length > 0 || current?.items.length || current?.notes.length) {
      trailing.push(line);
    }
  }
  flush();

  const slots = sections.filter((s) => !ADVICE_HEADING.test(s.label));
  const advice = sections.filter((s) => ADVICE_HEADING.test(s.label));

  if (slots.length < MIN_SLOTS) return null;

  return {
    slots,
    advice,
    note: trailing.length ? trailing.join(" ").replace(/\*\*/g, "").trim() || null : null,
  };
}
