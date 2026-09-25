/*
  Merchandising copy the redesign leaves as slots for Strengthiva to fill.

  The handoff shows "[ ADD OFFER — e.g. 15% off first order ]" in the home
  page's deal strip and hero ribbon — a placeholder, not a real offer. Until a
  real offer (with a matching Medusa promotion) exists, these stay null and
  both slots are hidden rather than advertising a discount nobody honours.
*/
export const STORE_OFFER: {
  /** Deal strip across the top of the home page, e.g. "15% off your first order". */
  strip: string
  /** Ribbon above the hero heading, e.g. "15% off on your first order". */
  ribbon: string
} | null = null

/*
  The home page's bundle. Handles of the three products in the Digestive Care
  Trio; the section hides itself if any of them is missing or unpriced. The
  price shown is the plain sum — there is no bundle discount (the prototype's
  own note: "Three honest prices, no invented bundle discount").
*/
export const HOME_BUNDLE = {
  title: "Digestive Care Trio",
  handles: ["digestiva-syrup", "easy-motion-plus-tablet", "agnivita-tablet"],
  shortNames: ["Digestiva", "Easy Motion+", "Agnivita"],
}

/** The three packs in the home hero panel (index.html → heroBottle1..3). */
export const HERO_PRODUCT_HANDLES = ["digestiva-syrup", "orthiva-oil", "mindiva-syrup"]
