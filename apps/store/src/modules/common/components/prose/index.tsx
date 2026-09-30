import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

/*
  Renders admin-authored copy (a product's `description`, and the metadata
  fields beside it) as formatted text instead of printing raw **asterisks**.

  Medusa's admin has no rich-text editor — `description` is a plain textarea,
  stored and served as plain text — so markdown is a storefront-side reading
  of that text. See docs/product-data-template.md for what authors may type.

  Two deliberate choices:

  - This is a *server* component. `Markdown` (react-markdown's default export,
    unlike its `MarkdownHooks` sibling) is synchronous and hook-free, so the
    markdown is turned into HTML during the render on the server and none of
    the parser reaches the browser bundle.

  - Raw HTML in the source is escaped, not rendered. react-markdown ignores
    embedded HTML unless `rehype-raw` is added, which is exactly what we want
    for text that arrives from the admin: an <img onerror> or <script> pasted
    into a description shows up as literal text rather than executing.

  Plain paragraphs of prose survive markdown unchanged, so it is safe to send
  copy through here whether or not the author used any markdown syntax.
*/

/** Headings inside a description must not compete with the page's own h1. */
const headingComponents = {
  // "# Title" and "## Title" both land at h3 — the page h1 is the product
  // name, and the accordion trigger above this is already the section label.
  h1: "h3",
  h2: "h3",
  h3: "h4",
  h4: "h5",
  h5: "h5",
  h6: "h6",
} as const

export default function Prose({
  children,
  className = "",
}: {
  /** Markdown source. Empty or whitespace-only renders nothing. */
  children?: string | null
  className?: string
}) {
  const source = (children ?? "").trim()
  if (!source) return null

  return (
    <div className={`prose${className ? ` ${className}` : ""}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...headingComponents,
          a: ({ href, children: linkChildren }) => {
            // Same-site links stay in the tab; anything external opens away
            // from the store, and never carries the referrer with it.
            const external = !!href && /^(https?:)?\/\//i.test(href)
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {linkChildren}
              </a>
            )
          },
        }}
      >
        {source}
      </Markdown>
    </div>
  )
}

/**
 * The same text with the markdown syntax taken out, for the places that need a
 * single plain line: SEO descriptions, card blurbs, `<title>`s, aria labels.
 * Deliberately small — it unwraps the inline syntax an author is likely to use
 * rather than re-implementing a parser.
 */
export function markdownToPlainText(source?: string | null): string {
  if (!source) return ""
  return (
    source
      // Fenced and inline code: keep the code, drop the fences/backticks.
      .replace(/```[^\n]*\n?/g, "")
      .replace(/`([^`]+)`/g, "$1")
      // Images before links — an image's "![alt](url)" leaves the alt text.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Leading block syntax: headings, quotes, list bullets.
      .replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
      .replace(/^[ \t]*>[ \t]?/gm, "")
      .replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]+/gm, "")
      // Horizontal rules.
      .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, "")
      // Emphasis / strong / strikethrough markers.
      .replace(/(\*\*\*|___)(.+?)\1/g, "$2")
      .replace(/(\*\*|__)(.+?)\1/g, "$2")
      .replace(/(\*|_)(.+?)\1/g, "$2")
      .replace(/~~(.+?)~~/g, "$1")
      // Whatever line structure is left becomes one line.
      .replace(/\s+/g, " ")
      .trim()
  )
}
