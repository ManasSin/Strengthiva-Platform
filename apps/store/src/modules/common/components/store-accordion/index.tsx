"use client"

import { useEffect, useRef, useState } from "react"

/* store.js → toggleAccordion, as a component. */
export default function StoreAccordion({
  items,
  defaultOpen = -1,
}: {
  items: { title: string; body: React.ReactNode }[]
  /** Index of the item open on first render (PDP opens the first one). */
  defaultOpen?: number
}) {
  return (
    <div>
      {items.map((item, i) => (
        <AccordionItem key={item.title} title={item.title} defaultOpen={i === defaultOpen}>
          {item.body}
        </AccordionItem>
      ))}
    </div>
  )
}

function AccordionItem({
  title,
  children,
  defaultOpen,
}: {
  title: string
  children: React.ReactNode
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)
  // The panel animates on max-height, which needs a pixel value, so the body
  // is measured and kept in sync as its content reflows. Keeping it in sync
  // matters because a product description is markdown of any length: a fixed
  // fallback cap would silently clip the section the PDP opens by default.
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const measure = () => setHeight(body.scrollHeight)
    measure()
    // Re-measure on reflow — a narrower viewport rewraps the text taller, and
    // images inside a description settle after they load.
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [])

  const toggle = () => setOpen((o) => !o)

  return (
    <div className={`accordion-item${open ? " open" : ""}`}>
      <button className="accordion-trigger" onClick={toggle} aria-expanded={open}>
        {title}
        <span className="plus" />
      </button>
      <div
        className="accordion-panel"
        // Before the first measurement an open panel is left uncapped, so the
        // server-rendered markup and first paint show all of the content.
        style={{ maxHeight: open ? height ?? "none" : 0 }}
      >
        <div className="accordion-body" ref={bodyRef}>
          {children}
        </div>
      </div>
    </div>
  )
}
