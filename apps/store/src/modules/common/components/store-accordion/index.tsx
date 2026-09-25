"use client"

import { useRef, useState } from "react"

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
  const panelRef = useRef<HTMLDivElement>(null)
  // Measured height while open, so the max-height transition runs both ways;
  // before first measurement an open panel uses the stylesheet's 600px cap.
  const [height, setHeight] = useState<number | null>(null)

  const toggle = () => {
    setHeight(panelRef.current?.scrollHeight ?? null)
    setOpen((o) => !o)
  }

  return (
    <div className={`accordion-item${open ? " open" : ""}`}>
      <button className="accordion-trigger" onClick={toggle} aria-expanded={open}>
        {title}
        <span className="plus" />
      </button>
      <div
        className="accordion-panel"
        ref={panelRef}
        style={{ maxHeight: open ? (height != null ? height : 600) : 0 }}
      >
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  )
}
