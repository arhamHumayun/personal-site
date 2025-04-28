import { Blockquote, H1, H2, H3, H4, InlineCode, Large, Lead, Muted, P } from "@/components/typography";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <H1>Arham Humayun</H1>
      <H2>Software Engineer</H2>
      <Lead>
        I'm a software engineer with a passion for building products that help
        people live better lives.
      </Lead>
      <H3>Typography Test</H3>
      <H4>This is an H4 heading</H4>
      <P>This is a regular paragraph with some 
        <InlineCode>inline code</InlineCode>
      to demonstrate different text styles.</P>
      <Blockquote>
        This is a blockquote to show how quoted text looks in our design system.
      </Blockquote>
      <Large>This is large text</Large>
      <Muted>This is muted text</Muted>
    </div>
  );
}
