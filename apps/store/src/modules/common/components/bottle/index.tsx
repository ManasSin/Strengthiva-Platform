import { ProductForm } from "@lib/util/store-catalog"

/*
  The redesign's honest pack placeholder (store.js → bottleSVG): a labelled
  line drawing of a tablet jar / syrup bottle / oil bottle / dropper, used
  wherever a product has no photography uploaded yet. Once an image exists in
  Medusa the real photo is shown instead (see ProductMedia).
*/

const initialsFor = (name: string) =>
  name.replace(/[a-z ]/g, "").slice(0, 3) || name.slice(0, 2).toUpperCase()

export default function Bottle({
  form,
  name,
}: {
  form: ProductForm
  name: string
}) {
  let body: React.ReactNode
  if (form === "syrup") {
    body = (
      <>
        <rect x="34" y="30" width="52" height="18" rx="4" fill="var(--forest)" />
        <path d="M40 48 h40 l6 14 v58 a6 6 0 0 1-6 6 H40 a6 6 0 0 1-6-6 V62 z" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="40" y="80" width="40" height="30" fill="var(--bg)" opacity=".55" />
      </>
    )
  } else if (form === "oil") {
    body = (
      <>
        <rect x="46" y="18" width="28" height="16" rx="3" fill="var(--forest)" />
        <rect x="52" y="10" width="16" height="10" rx="2" fill="var(--muted)" />
        <path d="M40 34 h40 v78 a8 8 0 0 1-8 8 H48 a8 8 0 0 1-8-8 z" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="40" y="70" width="40" height="42" fill="var(--bg)" opacity=".5" />
      </>
    )
  } else if (form === "drops") {
    body = (
      <>
        <rect x="50" y="14" width="20" height="14" rx="3" fill="var(--forest)" />
        <path d="M44 28 h32 l4 84 a10 10 0 0 1-10 10 H50 a10 10 0 0 1-10-10 z" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="44" y="78" width="32" height="34" fill="var(--bg)" opacity=".5" />
      </>
    )
  } else {
    body = (
      <>
        <rect x="38" y="22" width="44" height="14" rx="7" fill="var(--forest)" />
        <path d="M32 36 h56 v72 a10 10 0 0 1-10 10 H42 a10 10 0 0 1-10-10 z" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="32" y="66" width="56" height="42" fill="var(--bg)" opacity=".55" />
      </>
    )
  }

  return (
    <svg
      className="bottle-svg"
      viewBox="0 0 120 130"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${name} pack render — placeholder illustration, pending official product photography`}
    >
      {body}
      <text
        x="60"
        y="92"
        textAnchor="middle"
        fontFamily="DM Mono, monospace"
        fontSize="12"
        letterSpacing="1"
        fill="var(--green-deep)"
      >
        {initialsFor(name)}
      </text>
    </svg>
  )
}

/** Photo when Medusa has one, otherwise the labelled pack illustration. */
export function ProductVisual({
  thumbnail,
  form,
  name,
  padding,
  bare,
}: {
  thumbnail: string | null
  form: ProductForm
  name: string
  padding?: string
  /** Render the illustration without .bottle-wrap's inset (hero / bundle tiles). */
  bare?: boolean
}) {
  if (thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote R2/Medusa URL
      <img src={thumbnail} alt={name} loading="lazy" style={padding ? { padding } : undefined} />
    )
  }
  if (bare) return <Bottle form={form} name={name} />
  return (
    <div className="bottle-wrap" style={padding ? { padding } : undefined}>
      <Bottle form={form} name={name} />
    </div>
  )
}
