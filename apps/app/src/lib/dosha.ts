// Extracts a compact "Your Dosha" hero summary from the full dosha markdown
// analysis returned by the backend (see strengthiva-backend/app/services/
// prompts.py's DOSHA_PROMPT, which always opens with a "**Dominant Dosha:**
// [name] — [1 sentence]" line). Falls back gracefully if the model ever
// deviates from that format — never crashes on unexpected shapes.
export type DoshaHero = {
  name: string;
  blurb: string;
  components: string[];
};

const DOSHA_ICONS: Record<string, string> = {
  Vata: "🌬️",
  Pitta: "🔥",
  Kapha: "💧",
};

export function doshaIcon(component: string): string {
  return DOSHA_ICONS[component] ?? "🔸";
}

export function parseDoshaHero(markdown: string): DoshaHero {
  const plain = markdown.replace(/\*\*/g, "").trim();
  const match = markdown.match(/\*\*Dominant Dosha:\*\*\s*([^\n]+)/i);

  if (!match) {
    return {
      name: "Your Constitution",
      blurb: plain.slice(0, 220),
      components: uniqueDoshaComponents(plain),
    };
  }

  const full = match[1].trim();
  const emDashIdx = full.indexOf("—");
  const spacedHyphenIdx = full.indexOf(" - ");
  const splitIdx = emDashIdx > -1 ? emDashIdx : spacedHyphenIdx;

  const namePart = splitIdx > -1 ? full.slice(0, splitIdx).trim() : full;
  const descPart = splitIdx > -1 ? full.slice(splitIdx + 1).trim() : "";

  return {
    name: namePart.replace(/\*\*/g, ""),
    blurb: descPart || full,
    components: uniqueDoshaComponents(full),
  };
}

function uniqueDoshaComponents(text: string): string[] {
  const found = text.match(/Vata|Pitta|Kapha/gi) ?? [];
  const seen: string[] = [];
  for (const raw of found) {
    const normalized = raw[0].toUpperCase() + raw.slice(1).toLowerCase();
    if (!seen.includes(normalized)) seen.push(normalized);
  }
  return seen;
}
