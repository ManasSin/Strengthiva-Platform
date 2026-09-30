import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Text } from "@medusajs/ui"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Medusa's description field is a plain textarea, so an author writing product
// copy in markdown is typing blind. The storefront renders that text as
// markdown (apps/store/src/modules/common/components/prose), and this widget
// renders it the same way here, so the formatting can be checked without
// opening the store.
//
// It shows the SAVED description — the edit form is a separate drawer, so the
// preview updates once changes are saved, not as they are typed.
//
// Raw HTML is deliberately not rendered (no rehype-raw), matching the
// storefront: pasted <script>/<img onerror> shows as literal text.

const SYNTAX_HINTS = [
  ["## Heading", "a section heading"],
  ["**bold**", "bold"],
  ["*italic*", "italic"],
  ["- item", "a bullet list"],
  ["1. item", "a numbered list"],
  ["[text](https://…)", "a link"],
] as const

const ProductDescriptionPreview = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const description = (product.description ?? "").trim()

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Description preview</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          How the saved description reads on the store. Markdown is supported — save your
          edits to refresh this.
        </Text>
      </div>

      <div className="px-6 py-4">
        {description ? (
          <div className="text-ui-fg-base max-w-prose text-sm leading-relaxed">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                // Headings are flattened the same way the storefront does it,
                // so they never outrank the product title on the page.
                h1: ({ children }) => <h3 className="mb-2 mt-4 text-base font-medium first:mt-0">{children}</h3>,
                h2: ({ children }) => <h3 className="mb-2 mt-4 text-base font-medium first:mt-0">{children}</h3>,
                h3: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-medium first:mt-0">{children}</h4>,
                h4: ({ children }) => <h5 className="mb-2 mt-4 text-sm font-medium first:mt-0">{children}</h5>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1 last:mb-0">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1 last:mb-0">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-ui-fg-interactive underline">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-ui-border-strong text-ui-fg-subtle mb-3 border-l-2 pl-3 last:mb-0">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-ui-bg-subtle rounded px-1 py-0.5 font-mono text-xs">{children}</code>
                ),
                hr: () => <hr className="border-ui-border-base my-4" />,
                table: ({ children }) => (
                  <div className="mb-3 overflow-x-auto last:mb-0">
                    <table className="w-full border-collapse text-xs">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border-ui-border-base bg-ui-bg-subtle border px-2 py-1 text-left font-medium">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-ui-border-base border px-2 py-1 align-top">{children}</td>
                ),
                img: ({ src, alt }) => (
                  <img
                    src={typeof src === "string" ? src : undefined}
                    alt={alt ?? ""}
                    className="my-1 max-w-full rounded"
                  />
                ),
              }}
            >
              {description}
            </Markdown>
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            No description yet. Add one in Edit, and it will appear here formatted.
          </Text>
        )}
      </div>

      <div className="px-6 py-4">
        <Text size="xsmall" weight="plus" className="text-ui-fg-subtle mb-2">
          Markdown you can use
        </Text>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {SYNTAX_HINTS.map(([syntax, meaning]) => (
            <div key={syntax} className="flex items-baseline gap-2">
              <dt>
                <code className="bg-ui-bg-subtle rounded px-1 py-0.5 font-mono text-xs">{syntax}</code>
              </dt>
              <dd>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {meaning}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
        <Text size="xsmall" className="text-ui-fg-muted mt-2">
          Leave a blank line between paragraphs — a single line break does not start a new
          one. Tables and task lists (GitHub-flavoured markdown) work too.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductDescriptionPreview
