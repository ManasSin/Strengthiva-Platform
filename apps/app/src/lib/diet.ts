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

export type DietSlot = {
  /** The heading as written, brackets and bold markers stripped. */
  label: string;
  /** Bullet text, with any "Option A:" prefix removed. */
  items: string[];
};

export type ParsedDiet = {
  slots: DietSlot[];
  /** Anything trailing the last slot — DIET_PROMPT allows a BMI/demographic note. */
  note: string | null;
};

/** `**[Breakfast]**`, `**Breakfast**`, `### Breakfast` → "Breakfast" */
const HEADING = /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*\[?([^\]*#][^\]*]*?)\]?\s*(?:\*\*)?\s*:?\s*$/;
const BULLET = /^\s*[-*•]\s+(.*\S)\s*$/;
/** "Option A: 150 ml water" → "150 ml water"; also "A) …" and "1. …" */
const OPTION_PREFIX = /^(?:option\s+)?[a-z0-9]{1,2}\s*[):.-]\s*/i;

/**
 * Below this many slots the output clearly didn't follow the prompt, and a grid
 * built from one or two fragments misrepresents the plan. Callers render the
 * markdown instead.
 */
const MIN_SLOTS = 3;

export function parseDietPlan(markdown: string): ParsedDiet | null {
  if (!markdown?.trim()) return null;

  const lines = markdown.split("\n");
  const slots: DietSlot[] = [];
  const trailing: string[] = [];
  let current: DietSlot | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const bullet = line.match(BULLET);
    if (bullet && current) {
      current.items.push(bullet[1].replace(OPTION_PREFIX, "").trim());
      continue;
    }

    // A heading only counts once we know it has bullets under it, so the
    // document title ("**Personalised Single-Day Diet Plan for Mansi**") and any
    // closing prose don't become empty cells.
    const heading = line.match(HEADING);
    const looksLikeHeading =
      heading && (line.startsWith("**") || line.startsWith("#") || line.startsWith("["));

    if (looksLikeHeading) {
      if (current?.items.length) slots.push(current);
      current = { label: heading[1].trim(), items: [] };
      continue;
    }

    // Plain prose. Before any slot it's the title; after them it's the note.
    if (slots.length > 0 || current?.items.length) trailing.push(line);
  }
  if (current?.items.length) slots.push(current);

  if (slots.length < MIN_SLOTS) return null;

  return {
    slots,
    note: trailing.length ? trailing.join(" ").replace(/\*\*/g, "").trim() || null : null,
  };
}
