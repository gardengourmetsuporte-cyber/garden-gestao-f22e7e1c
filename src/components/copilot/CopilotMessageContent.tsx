import ReactMarkdown from 'react-markdown';

interface CopilotMessageContentProps {
  content: string;
}

export default function CopilotMessageContent({ content }: CopilotMessageContentProps) {
  return (
    <div className="copilot-markdown prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1 last:mb-0 text-[13px] leading-[1.6]">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
          ul: ({ children }) => <ul className="list-none pl-0 mb-1 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="text-[13px] leading-[1.5] flex gap-1.5 items-start"><span className="text-primary/60 mt-[2px] shrink-0">•</span><span>{children}</span></li>,
          h1: ({ children }) => <h3 className="font-bold text-[13px] mb-0.5 text-foreground">{children}</h3>,
          h2: ({ children }) => <h3 className="font-bold text-[13px] mb-0.5 text-foreground">{children}</h3>,
          h3: ({ children }) => <h3 className="font-bold text-[13px] mb-0.5 text-foreground">{children}</h3>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-1.5 rounded-lg">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border/20 px-2.5 py-1.5 bg-secondary/30 font-semibold text-left text-[11px]">{children}</th>,
          td: ({ children }) => <td className="border border-border/20 px-2.5 py-1.5 text-[11px]">{children}</td>,
          code: ({ children }) => <code className="bg-secondary/40 px-1.5 py-0.5 rounded-md text-[11px] font-mono">{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
