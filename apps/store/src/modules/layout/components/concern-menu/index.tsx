"use client"

import { CategoryTile } from "@lib/util/store-catalog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/*
  "Shop by Concern" dropdown in the header — every Medusa category, listed by
  its shopper-facing concern ("Bloating & Digestion") with the category name
  as the small label above it, and the category photo as the thumbnail.

  Opens on hover (with a short close delay so the pointer can cross the gap),
  and on click / Enter / Space for touch and keyboard users. Esc, clicking
  outside, or navigating closes it.
*/
export default function ConcernMenu({ categories }: { categories: CategoryTile[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // True while the menu is open because the pointer is over it. A click that
  // lands during a hover must not toggle it shut again (mouseenter already
  // opened it); only keyboard / touch-without-hover clicks toggle.
  const openedByHover = useRef(false)
  const pathname = usePathname()

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const show = () => {
    cancelClose()
    openedByHover.current = true
    setOpen(true)
  }
  const hideSoon = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      openedByHover.current = false
      setOpen(false)
    }, 150)
  }

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onDown)
    }
  }, [open])

  useEffect(() => cancelClose, [])

  if (!categories.length) return null

  return (
    <div
      className={`nav-drop${open ? " open" : ""}`}
      ref={rootRef}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="nav-drop-trigger"
        aria-expanded={open}
        aria-controls="concern-menu"
        onClick={() => setOpen((o) => (openedByHover.current ? true : !o))}
      >
        Shop by Concern
        <svg viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <div className="nav-drop-panel" id="concern-menu" hidden={!open}>
        <div className="nav-drop-grid">
          {categories.map((c) => (
            <LocalizedClientLink
              key={c.id}
              href={`/categories/${c.handle}`}
              className="nav-drop-item"
              onClick={() => setOpen(false)}
            >
              <span className="nav-drop-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative; may be a remote R2 URL */}
                <img src={c.image} alt="" loading="lazy" />
              </span>
              <span>
                <span className="nav-drop-label">{c.label}</span>
                <span className="nav-drop-title">{c.concernLabel}</span>
              </span>
            </LocalizedClientLink>
          ))}
        </div>
        <LocalizedClientLink href="/#concerns" className="nav-drop-foot" onClick={() => setOpen(false)}>
          Browse by how you feel →
        </LocalizedClientLink>
      </div>
    </div>
  )
}
