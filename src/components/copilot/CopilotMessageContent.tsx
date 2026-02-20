import ReactMarkdown from 'react-markdown';

interface CopilotMessageContentProps {
  content: string;
}

export default function CopilotMessageContent({ content }: CopilotMessageContentProps) {
  return (
    <div className="copilot-markdown prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          h1: ({ children }) => <h3 className="font-bold text-sm mb-1">{children}</h3>,
          h2: ({ children }) => <h3 className="font-bold text-sm mb-1">{children}</h3>,
          h3: ({ children }) => <h3 className="font-bold text-sm mb-1">{children}</h3>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-1.5">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border/50 px-2 py-1 bg-secondary/40 font-semibold text-left">{children}</th>,
          td: ({ children }) => <td className="border border-border/50 px-2 py-1">{children}</td>,
          code: ({ children }) => <code className="bg-secondary/60 px-1 py-0.5 rounded text-xs">{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
