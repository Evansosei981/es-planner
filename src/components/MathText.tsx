import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * MathText renders text containing LaTeX formulas ($...$ for inline, $$...$$ for block)
 * and auto-formats common mathematical expressions using KaTeX.
 */
export const MathText: React.FC<MathTextProps> = ({
  content,
  className = '',
  inline = false
}) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Normalize brackets \[ ... \] and \( ... \) to $$ and $
    let text = content
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

    // If the text contains no dollar delimiters but has obvious LaTeX formulas like \frac, \sqrt, \int, \sum,
    // let's wrap those tokens into $...$ automatically
    if (!text.includes('$')) {
      // Check for standalone LaTeX commands
      if (/\\[a-zA-Z]+|\^[0-9a-zA-Z{}]+|_[0-9a-zA-Z{}]+|\b(pi|theta|alpha|beta|lambda|sigma)\b/i.test(text)) {
        // If the entire text is a math expression
        if (/^[a-zA-Z0-9\s+\-*/=^_()\\{}[\].,<>≤≥±≠≈]+$/.test(text) && /[+\-*/=^_\\<>]/.test(text)) {
          text = `$${text}$`;
        }
      }
    }

    // Split text by $$ (block math) and $ (inline math)
    // Regex matches $$...$$ or $...$
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
    const parts = text.split(mathRegex);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        const mathContent = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathContent, {
            displayMode: true,
            throwOnError: false
          });
          return (
            <span
              key={index}
              className="block my-2 overflow-x-auto custom-scrollbar text-center py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-amber-400">{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        const mathContent = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(mathContent, {
            displayMode: false,
            throwOnError: false
          });
          return (
            <span
              key={index}
              className="inline-math mx-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-amber-400">{part}</span>;
        }
      } else {
        // Regular prose text
        return <span key={index}>{part}</span>;
      }
    });
  }, [content]);

  return <span className={className}>{renderedElements}</span>;
};
