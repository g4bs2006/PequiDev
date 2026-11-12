import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Como cada elemento do Markdown aparece no site. O texto vem do banco e pode
 * trazer títulos: eles começam em h3, porque o h2 é de quem monta a página.
 */
const components: Components = {
  h1: ({ children }) => <h3 className={heading}>{children}</h3>,
  h2: ({ children }) => <h3 className={heading}>{children}</h3>,
  h3: ({ children }) => <h3 className={heading}>{children}</h3>,
  h4: ({ children }) => <h4 className="mt-2 font-display text-lg font-bold">{children}</h4>,
  p: ({ children }) => <p className="text-pretty">{children}</p>,
  ul: ({ children }) => (
    <ul className="grid list-disc gap-2.5 pl-5 marker:text-ink-soft">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="grid list-decimal gap-2.5 pl-5 marker:text-ink-soft">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1 text-pretty">{children}</li>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-4"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="grid gap-4 border-l-4 border-accent pl-5 text-ink-soft">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-ink/10 px-1.5 py-0.5 font-mono text-[0.875em]">{children}</code>
  ),
  hr: () => <hr className="border-ink/15" />,
};

const heading = "mt-4 font-display text-xl font-bold tracking-tight";

/** Texto em Markdown vindo do banco, já com a tipografia do site. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="grid gap-4 text-lg">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
