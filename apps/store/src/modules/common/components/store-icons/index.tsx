import React from "react"

/*
  The line icons used across the store redesign, lifted verbatim from the
  handoff HTML (24×24, 1.6–1.8 stroke, currentColor). Sizing comes from the
  surrounding class (.icon-btn svg, .usp-item svg, …), as in the prototype.
*/

type IconProps = React.SVGProps<SVGSVGElement> & { strokeWidth?: number }

const make = (paths: React.ReactNode, defaultStroke = 1.8) => {
  const Icon = ({ strokeWidth = defaultStroke, ...props }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    >
      {paths}
    </svg>
  )
  return Icon
}

export const MenuIcon = make(<path d="M4 7h16M4 12h16M4 17h16" />)
export const CloseIcon = make(<path d="M6 6l12 12M18 6L6 18" />)
export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>
)
export const UserIcon = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" />
  </>
)
export const CartIcon = make(
  <>
    <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 8H6" />
    <circle cx="9" cy="21" r="1" />
    <circle cx="18" cy="21" r="1" />
  </>
)
export const CartEmptyIcon = make(
  <path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 8H6" />,
  1.6
)
export const HomeIcon = make(<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />)
export const BagIcon = make(
  <>
    <path d="M6 8h12l-1 12H7z" />
    <path d="M9 8a3 3 0 0 1 6 0" />
  </>
)
export const HeartIcon = make(
  <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z" />
)
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />)
export const FilterIcon = make(<path d="M4 6h16M7 12h10M10 18h4" />, 1.6)
export const ShieldIcon = make(<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />)
export const ShieldCheckIcon = make(
  <>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </>,
  1.6
)
export const LinesIcon = make(<path d="M3 6h18M3 12h18M3 18h11" />)
export const CheckCircleIcon = make(
  <>
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="9" />
  </>
)
export const CheckIcon = make(<path d="M20 6L9 17l-5-5" />, 2)
export const BookIcon = make(
  <>
    <path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
  </>
)
export const TagIcon = make(<path d="M3 3l8.5 8.5M3 3l7 16 3-6 6-3z" />, 2)

/* Concern-tile marks, keyed by category handle (index.html → concernIconMap). */
export const CONCERN_ICONS: Record<string, React.ReactNode> = {
  "joint-health": <path d="M7 12a3 3 0 1 1 3-3M17 12a3 3 0 1 0-3 3M10 9l4 6" />,
  "gut-health": (
    <>
      <path d="M12 3c-2 3-4 4-4 8a4 4 0 0 0 8 0c0-1.2-.5-2-1-2.8" />
      <path d="M12 3c1 1.5 1 2.5.6 3.6" />
    </>
  ),
  "respiratory-health": (
    <>
      <path d="M9 3v6a3 3 0 0 1-3 3 3 3 0 0 0-3 3v2a2 2 0 0 0 2 2h2" />
      <path d="M15 3v6a3 3 0 0 0 3 3 3 3 0 0 1 3 3v2a2 2 0 0 1-2 2h-2" />
      <path d="M12 3v9" />
    </>
  ),
  "renal-health": <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" />,
  "liver-health": (
    <>
      <path d="M4 19.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </>
  ),
  "weight-management": (
    <>
      <path d="M12 4v3M4 21l3.5-9h9L20 21" />
      <circle cx="12" cy="13.5" r="4.5" />
    </>
  ),
  "nervous-system": <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  "gynaecological-disorder": <path d="M12 2.5s5 5.5 5 10a5 5 0 0 1-10 0c0-4.5 5-10 5-10z" />,
}

export const ConcernIcon = ({ handle }: { handle: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
    {CONCERN_ICONS[handle] ?? (
      <>
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    )}
  </svg>
)
