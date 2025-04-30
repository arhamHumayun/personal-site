import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SyntaxHighligherWrapperProps {
  text: string;
  language?: string;
}

export function SyntaxHighligherWrapper({ text, language = 'tsx' }: SyntaxHighligherWrapperProps) {
  return (
    <div className="w-full overflow-hidden -mx-0">
      <div className="min-w-0 w-full">
        <div className="overflow-x-auto">
          <div className="min-w-0 w-full">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              PreTag="div"
              wrapLines={true}
              wrapLongLines={true}
              // showLineNumbers={true}
              className="rounded-md my-4 text-xs sm:text-sm md:text-base"
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: 'inherit',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                overflowWrap: 'break-word',
                display: 'block',
                overflow: 'visible',
              }}
              codeTagProps={{
                style: {
                  display: 'block',
                  minWidth: 0,
                  width: '100%',
                }
              }}
            >
              {text}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}