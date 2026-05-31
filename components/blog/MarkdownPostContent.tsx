import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import Image from "next/image";
import {
  H1,
  H2,
  H3,
  H4,
  P,
  UL,
  LI,
  A,
  Blockquote,
  InlineCode,
  Table,
  Th,
  Thead,
  Tr,
  Tbody,
  Td,
} from "@/components/typography";
import { SyntaxHighligherWrapper } from "@/components/syntax-highligher-wrapper";

const markdownComponents: Components = {
  h1: ({ children }) => <H1 className="mt-8">{children}</H1>,
  h2: ({ children }) => <H2>{children}</H2>,
  h3: ({ children }) => <H3>{children}</H3>,
  h4: ({ children }) => <H4>{children}</H4>,
  p: ({ children }) => <P>{children}</P>,
  ul: ({ children }) => (
    <UL className="[&_ul]:mt-2 [&_ul]:ml-4 [&_ul]:list-[circle]">
      {children}
    </UL>
  ),
  ol: ({ children }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 [&_ol]:mt-2 [&_ol]:ml-4">
      {children}
    </ol>
  ),
  li: ({ children }) => <LI>{children}</LI>,
  a: ({ href, children }) => <A href={href}>{children}</A>,
  blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") {
      return null;
    }

    const isGif = src.endsWith(".gif");

    return (
      <Image
        src={src}
        alt={alt ?? ""}
        width={isGif ? 500 : 700}
        height={isGif ? 500 : 400}
        unoptimized={isGif}
        className={
          isGif
            ? "my-8 mx-auto block w-full h-auto max-w-[500px]"
            : "my-8 mx-auto block rounded-lg w-full h-auto max-w-[700px]"
        }
      />
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <Table className="min-w-full text-sm border border-muted-foreground">
        {children}
      </Table>
    </div>
  ),
  thead: ({ children }) => <Thead>{children}</Thead>,
  tbody: ({ children }) => <Tbody>{children}</Tbody>,
  tr: ({ children }) => <Tr>{children}</Tr>,
  th: ({ children }) => <Th>{children}</Th>,
  td: ({ children }) => <Td>{children}</Td>,
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className ?? "");
    const language = match?.[1];
    const code = String(children).replace(/\n$/, "");

    if (language) {
      return <SyntaxHighligherWrapper text={code} language={language} />;
    }

    return <InlineCode>{children}</InlineCode>;
  },
  pre: ({ children }) => <>{children}</>,
  hr: () => <hr className="my-8 border-t border-muted-foreground/20" />,
};

export function MarkdownPostContent({ content }: { content: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </Markdown>
  );
}
