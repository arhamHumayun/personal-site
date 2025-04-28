import { H2, P, UL, LI, A, Table, Th, Thead, Tr, Tbody, Td, Muted, H3, H4, Blockquote } from '@/components/typography';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { BlogPostHeader } from '@/components/blog/BlogPostHeader';

export const metadata = {
  title: "Building a Snappy, Reliable AI Chat with Convex",
  description: "How I built a persistent, reliable chat system with Convex and the AI SDK",
  date: "2025-04-10",
};

export default function StreamedAIResponsePost() {
  return (
    <BlogPostLayout>
      <BlogPostHeader
        title={metadata.title}
        description={metadata.description}
        date={metadata.date}
      />
      <P>
        I wanted to build an AI chat that streams responses in real-time, persists messages, survives refreshes, and supports multiple LLMs and structured generation. Most frameworks make this hard.
      </P>
      <UL>
        <LI>Streamed, real-time assistant responses</LI>
        <LI>Messages saved as they generate</LI>
        <LI>Survives refreshes and disconnects</LI>
        <LI>Multiple AI models (OpenAI, Claude, Gemini...)</LI>
        <LI>Structured generation</LI>
        <LI>Clean, production-ready code</LI>
      </UL>

      <Blockquote>Why the Vercel AI SDK?</Blockquote>
      <P>
        The <A href="https://sdk.vercel.ai">Vercel AI SDK</A> is great for swapping LLMs, structured generation, and a clean interface. But <code>useChat()</code> is limiting for production chat UIs that need custom streaming and persistence.
      </P>

      <H2>The F5 Problem</H2>
      <P>
        Most AI chats lose in-progress responses if you refresh or disconnect. They stream over HTTP, so if the request is interrupted, you lose the message unless you save every chunk.
      </P>
      <div className="overflow-x-auto my-4">
        <Table className="min-w-full text-sm border border-muted-foreground">
          <Thead>
            <Tr>
              <Th>Platform</Th>
              <Th>Result</Th>
              <Th>Details</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td><A href="https://chatgpt.com">chatgpt.com</A></Td>
              <Td>⚠️ Partial Pass</Td>
              <Td>Requires another refresh to see the complete response</Td>
            </Tr>
            <Tr>
              <Td><A href="https://claude.ai/">claude.ai</A></Td>
              <Td>❌ Fail</Td>
              <Td>Response is lost entirely when the page is refreshed</Td>
            </Tr>
            <Tr>
              <Td><A href="https://t3.chat">T3.chat</A></Td>
              <Td>❌ Fail</Td>
              <Td>Response is stuck at the point of interruption</Td>
            </Tr>
            <Tr>
              <Td><A href="https://chat.vercel.ai">chat.vercel.ai</A></Td>
              <Td>❌ Fail</Td>
              <Td>Response is lost entirely when refreshing the page</Td>
            </Tr>
            <Tr>
              <Td><A href="https://chatprd.ai">chatprd.ai</A></Td>
              <Td>❌ Fail</Td>
              <Td>Shows error alert for in-progress response, then loses it</Td>
            </Tr>
            <Tr>
              <Td><A href="https://perplexity.ai">Perplexity</A></Td>
              <Td>⚠️ Partial Pass</Td>
              <Td>Requires another refresh to see the complete response</Td>
            </Tr>
            <Tr>
              <Td><A href="https://sdk.vercel.ai/playground">sdk.vercel.ai/playground</A></Td>
              <Td>❌ Fail</Td>
              <Td>Chat is lost entirely on refresh</Td>
            </Tr>
          </Tbody>
        </Table>
      </div>
      <Muted>
        As of 2025-04-28. Tested on Chrome
      </Muted>
      <P>
        To get both real-time streaming and persistence, you need to decouple the LLM stream from the HTTP request and persist every chunk. Most frameworks don't help you do this. The Vercel AI SDK assumes Node and Next.js API routes. If you use Convex or another backend, you end up streaming across systems, adding latency and risk.
      </P>

      <Blockquote>How does Convex help?</Blockquote>
      <P>
        <A href="https://convex.dev">Convex</A> lets you put LLM logic right next to your database. This means we have minimal API hops, and fast operatations.
      </P>

      <Blockquote>Saving Every Token?</Blockquote>
      <P>
        Saving every token chunk to Convex is too many writes. A job queue could help, but then you lose streaming. My solution: buffer tokens in memory and save to Convex every 150ms.
      </P>
      <P>
        Let me show you the solution I came up with.
      </P>
      <H2>1. Start the chat with <code>startChatMessagePair</code>.</H2>
      <P>This Convex action:</P>
      <UL>
        <LI>Stores the user's message</LI>
        <LI>Creates a blank assistant message</LI>
        <LI>Immediately schedules a job to generate the reply</LI>
      </UL>
      <SyntaxHighlighter
        language="typescript"
        style={vscDarkPlus}
        PreTag="div"
        className="rounded-md my-4"
      >
        {`// In your client component
const startChat = useAction(api.chat.startChatMessagePair);

const sendMessage = async () => {
  if (!input.trim()) return;

  setIsSending(true);

  await startChat({
    threadId,
    worldId,
    content: input,
  });

  setInput('');
  setIsSending(false);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await sendMessage();
  formRef.current?.reset();
};`}
      </SyntaxHighlighter>

      <H2>2. Save the user's message and initiate the LLM response</H2>
      <P>This Convex action:</P>
      <UL>
        <LI>Saves the user message</LI>
        <LI>Creates a blank assistant message</LI>
        <LI>Schedules the LLM job to generate the reply immediately</LI>
      </UL>
      <SyntaxHighlighter
        language="typescript"
        style={vscDarkPlus}
        PreTag="div"
        className="rounded-md my-4"
      >
        {`export const startChatMessagePair = action({
  args: {
    threadId: v.id('messageThreads'),
    content: v.string(),
    worldId: v.id('worlds'),
  },
  returns: v.object({
    assistantMessageId: v.id("messages"),
  }),
  handler: async (ctx, { threadId, content, worldId }) => {
    // 1. Create user message and blank assistant message concurrently for better performance
    const [_, assistantMessageId] = await Promise.all([
      ctx.runMutation(api.messages.createMessage, {
        threadId,
        role: 'user',
        content,
        isComplete: true,
      }),
      ctx.runMutation(api.messages.createMessage, {
        threadId,
        role: 'assistant',
        content: '',
        isComplete: false,
      })
    ]);

    // 2. Schedule the LLM job immediately
    await ctx.scheduler.runAfter(0, internal.llm.generateAssistantMessage, {
      threadId,
      content,
      assistantMessageId,
      worldId,
    });

    return { assistantMessageId };
  },
});`}
      </SyntaxHighlighter>

      <H2>3. Generate the response in <code>internal.llm.generateAssistantMessage</code></H2>
      <P>This internal Convex action:</P>
      <UL>
        <LI>Uses <code>streamText()</code> from the Vercel AI SDK</LI>
        <LI>Streams tokens with <code>for await...of result.textStream</code></LI>
        <LI>Keeps them in memory</LI>
        <LI>Saves to Convex every 150ms</LI>
      </UL>
      <SyntaxHighlighter
        language="typescript"
        style={vscDarkPlus}
        PreTag="div"
        className="rounded-md my-4"
      >
        {`export const generateAssistantMessage = internalAction({
  args: {
    threadId: v.id("messageThreads"),
    content: v.string(),
    assistantMessageId: v.id("messages"),
    worldId: v.id("worlds"),
  },

  handler: async (ctx, args) => {
    const [messages, characters] = await Promise.all([
      ctx.runQuery(api.messages.getMessages, {
        threadId: args.threadId,
      }),
      ctx.runQuery(api.playerCharacters.getByWorldId, {
        worldId: args.worldId,
      }),
    ]);

    const fullPrompt = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: args.content },
    ];

    console.log("Starting text generation...");

    const result = streamText({
      model: openai("gpt-4.1-mini"),
      system: 
\`You are a game master for a text-based RPG called Veilborn. 
You are currently in a world with the following characters:
\${JSON.stringify(characters)}
\`,
      messages: fullPrompt as CoreMessage[],
    });

    let accumulated = "";
    let buffer = "";
    let flushTimeout: NodeJS.Timeout | null = null;

    const flush = async () => {
      if (!buffer) return;
      accumulated += buffer;
      buffer = "";

      await ctx.runMutation(api.messages.update, {
        messageId: args.assistantMessageId,
        threadId: args.threadId,
        role: "assistant",
        content: accumulated,
        isComplete: false,
      });
    };

    for await (const chunk of result.textStream) {
      buffer += chunk;

      if (!flushTimeout) {
        flushTimeout = setTimeout(async () => {
          await flush();
          flushTimeout = null;
        }, 150);
      }
    }

    if (flushTimeout) clearTimeout(flushTimeout);
    await flush();

    // Final mark complete
    await ctx.runMutation(api.messages.update, {
      messageId: args.assistantMessageId,
      threadId: args.threadId,
      role: "assistant",
      content: accumulated,
      isComplete: true,
    });

    console.log("Text generation finished.");
  },
});`}
      </SyntaxHighlighter>

      <H2>4. Use <code>useQuery</code> to stream the response</H2>
      <P>
        Convex's <code>useQuery</code> is reactive, so it'll update as soon as the message is saved.
      </P>
      <SyntaxHighlighter
        language="tsx"
        style={vscDarkPlus}
        PreTag="div"
        className="rounded-md my-4"
      >
        {`const messages = useQuery(api.messages.getMessages, { threadId });

// ...
return (
  <div>
    {messages?.map(message => (
      <div key={message._id} className="whitespace-pre-wrap mb-2">
        <strong>{message.role === 'user' ? 'User:' : 'AI:'}</strong> {message.content}
        {!message.isComplete && message.role === 'assistant' && <span className="animate-pulse">▍</span>}
      </div>
    ))}
  </div>
);`}
      </SyntaxHighlighter>

      <H2>Results</H2>
      <UL>
        <LI>Simple to implement</LI>
        <LI>Streaming feel even after disconnects</LI>
        <LI>Controlled database load</LI>
      </UL>

      <P>
        Hope this helps if you're building something similar. Like everything in engineering, this solution has tradeoffs, but it works well for me.
      </P>
      <P>
        If you're building something real with AI don't just trust the magic SDKs. Understand what's happening under the hood. Own your infra.
      </P>

      <H2>What This is For: Veilborn</H2>
      <P>
        This system powers Veilborn, an infinite, AI-enhanced, text-based RPG for the web. It combines:
      </P>
      <UL>
        <LI>The story depth of The Witcher 3</LI>
        <LI>The character building of Soulslikes</LI>
        <LI>Turn-based combat with deep strategy</LI>
        <LI>A persistent world with AI-driven storytelling</LI>
      </UL>
      <P>
        It's ambitious, but I've never been more excited about a project.
      </P>
      <P>
        Also, if you're into TTRPGs, check out my side project: <A href="https://monsterlabs.app">MonsterLabs.app</A>, where you can create AI-driven monsters and items for D&amp;D.
        I also wrote about it <A href="/blog/monster-labs-1">here</A>.
      </P>
    </BlogPostLayout>
  );
}
