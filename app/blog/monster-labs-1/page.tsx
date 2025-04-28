// app/blog/my-first-post/page.tsx
import { H2, P, UL, LI } from '@/components/typography';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { BlogPostHeader } from '@/components/blog/BlogPostHeader';

// Export metadata for the blog preview list
export const metadata = {
  title: "Building Better AI Applications with Structured Output",
  description: "How I built MonsterLabs using structured object generation and what I learned about building SaaS products",
  date: "2024-12-21", // Converted from Dec 21 2024
  heroImage: "/images/monsterlabs.webp",
};

export default function StructuredOutputPost() {
  return (
    <BlogPostLayout>
      <BlogPostHeader
        title={metadata.title}
        description={metadata.description}
        date={metadata.date}
        heroImage={metadata.heroImage}
      />

      <P>
        One of my goals for 2024 was to build a software product that actually made money. I&#39;ve been working on MonsterLabs, an AI-powered platform for generating custom Dungeons & Dragons monsters and magic items. While building this project, I learned a lot about structured object generation with AI and how to build a successful SaaS product. Let me share what I&#39;ve learned.
      </P>

      <H2>The Power of Structured Output in AI Applications</H2>
      <P>
        When building AI-powered applications, one of the most critical aspects is ensuring consistent, reliable output from the AI model. I&#39;ve found that structured output (or function calling) is absolutely crucial for this. While structured outputs weren&#39;t available when I started MonsterLabs, I used function calling, which essentially involves getting the AI to return a JSON object that follows a specific schema.
      </P>
      <P>
        The key to success here is creating a well-defined, consistent data structure that the AI can easily understand. I used Zod for schema validation, and it&#39;s been a game-changer. Here&#39;s a practical example from MonsterLabs:
      </P>

      <SyntaxHighlighter
        language="typescript"
        style={vscDarkPlus}
        PreTag="div"
        className="rounded-md my-4"
        // wrapLines={true}
        // wrapLongLines={true}
      >
        {`import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string(),
  type: z.union([
    z.literal('Weapon'), z.literal('Armor'), z.literal('Ammunition'), 
    z.literal('Potion'), z.literal('Scroll'), z.literal('Ring'), 
    z.literal('Wand'), z.literal('Rod'), z.literal('Staff'), z.literal('Wondrous item'), 
    z.literal('Consumable'), z.literal('Tool'), z.literal('Trinket')
  ]),
  subtype: z.string()
    .nullable()
    .describe("Subtype of the item, if applicable. Examples include 'longsword', 'dagger', or 'plate', 'chain' etc. Leave blank if not applicable."),
  rarity: z.union([
    z.literal('common'), z.literal('uncommon'), z.literal('rare'), 
    z.literal('very rare'), z.literal('legendary')
  ]),
  requiresAttunement: z.boolean()
    .describe("Whether the item requires attunement, and if so, whether it requires attunement by a specific class. Only applies to magical items that are very special and powerful. It should make sense for lore reasons. Generally avoid requiring attunement unless it makes a lot of sense."),
  requiresAttunementSpecific: z.string()
    .describe("If the item requires attunement, specify what conditions someone must have in to attune to it. Do not include if the item does not require attunement. Always structure your sentence as 'requires attunement by ...'. For example, 'requires attunement by a wizard' or 'requires attunement by a creature of good alignment' or 'requires attunement by an elf, half-elf, or a ranger'.")
    .nullable()
    .optional(),
  cost: z.number().describe("Cost in gold pieces"),
  weight: z.number().describe("Weight in pounds"),
  description: z.string()
    .describe("A detailed and inspired description of the item. This should include its visual description, lore, history, and any other relevant information."),
  paragraphs: z.array(z.object({
    title: z.string(),
    content: z.string()
  })).describe("Description of the item. If the item can do something, explain how it works here. For example if it needs an action or bonus action to activate, or if it has charges, when they recharge etc."),
});`}
      </SyntaxHighlighter>

      <P>Some key lessons I learned about structured output:</P>
      <UL>
        <LI>Use unions and literals to strictly define possible values</LI>
        <LI>Leverage the `describe` method to provide clear context to the AI</LI>
        <LI>Make your schema as detailed as possible while keeping it logical</LI>
        <LI>Use nullable fields when appropriate to handle edge cases</LI>
        <LI>Structure nested objects carefully to maintain consistency</LI>
      </UL>

      <H2>Optimizing the Application</H2>
      <P>
        While building MonsterLabs, I also learned valuable lessons about application optimization. NextJS&#39;s caching and ISR (Incremental Static Regeneration) capabilities were crucial for performance. For example, when viewing a single monster or magic item, we cache the API response and serve it instantly on subsequent loads.
      </P>
      <P>Data fetching optimization was another important aspect. Here&#39;s a practical example of concurrent database queries:</P>

      <SyntaxHighlighter
        language="typescript"
        style={vscDarkPlus}
        PreTag="div"
        className="rounded-md my-4"
        // wrapLines={true}
        // wrapLongLines={true}
      >
        {`// Both of these queries will run concurrently
const [monsters, items] = await Promise.allSettled([
  db.query('SELECT * FROM monsters'),
  db.query('SELECT * FROM items')
]);

// The items query will run after the monsters query has completed
const monsters = await db.query('SELECT * FROM monsters');
const items = await db.query('SELECT * FROM items');`}
      </SyntaxHighlighter>

      <H2>The SaaS Journey</H2>
      <P>
        While the technical aspects of building with AI were fascinating, the journey of creating a SaaS product was equally enlightening. I focused on marketing through Reddit and Product Hunt, targeting DnD communities that would find value in MonsterLabs. Getting my first real customers was a huge milestone - seeing people actually use and pay for something I created was incredibly rewarding.
      </P>
      <div className="my-8 flex flex-col items-center">
        <Image
          src="/images/stripe-moneys.webp"
          alt="Net income from Stripe screenshot"
          width={700}
          height={400}
          className="rounded-lg"
        />
        <P className="text-center text-sm text-muted-foreground mt-2">Net income from Stripe</P>
      </div>

      <H2>Conclusion</H2>
      <P>
        Building MonsterLabs taught me that success in AI-powered applications comes from three main factors:
      </P>
      <UL>
        <LI>Well-structured data and clear schemas</LI>
        <LI>Optimized application performance</LI>
        <LI>Understanding your market and users</LI>
      </UL>
      <P>
        While I&#39;ve only scratched the surface of what I&#39;ve learned (this could easily be a book!), these insights have been invaluable. I&#39;m excited to continue improving MonsterLabs and sharing more lessons learned along the way.
      </P>
    </BlogPostLayout>
  );
}