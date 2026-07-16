import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders LLM-generated markdown (report summary/dosha/diet — see
// strengthiva-backend/app/services/prompts.py) as real HTML instead of raw
// **asterisks**/bullets as plain text. Text color is intentionally left to
// `currentColor` (no hardcoded text-foreground/text-white here) so the same
// component works inside both light cards and the colored hero card.
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`space-y-3 text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h4 className="font-headline text-base font-bold">{children}</h4>,
          h2: ({ children }) => <h4 className="font-headline text-base font-bold">{children}</h4>,
          h3: ({ children }) => <h4 className="font-headline text-sm font-bold">{children}</h4>,
          code: ({ children }) => <code className="rounded bg-black/10 px-1 py-0.5 text-xs">{children}</code>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
