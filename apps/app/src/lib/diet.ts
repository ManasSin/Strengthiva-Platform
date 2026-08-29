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
      // Checked BEFORE the option prefix is stripped: "Benefits: …" has no
      // option prefix, and stripping first can eat the first word of a note.
      if (NOTE_LABEL.test(body)) current.notes.push(body);
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
