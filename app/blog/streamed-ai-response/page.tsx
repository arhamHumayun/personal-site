import { H2, P, UL, LI, A, Table, Th, Thead, Tr, Tbody, Td, Muted, Blockquote, H1 } from '@/components/typography';
import { BlogPostLayout } from '@/components/blog/BlogPostLayout';
import { BlogPostHeader } from '@/components/blog/BlogPostHeader';
import Image from 'next/image';
import { SyntaxHighligherWrapper } from '@/components/syntax-highligher-wrapper';

export const metadata = {
  title: "Unbreakable AI Chat: Streaming Responses with Convex + Vercel AI SDK",
  description: "How I built a persistent, reliable chat system with Convex and the AI SDK",
  date: "2025-04-30",
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
      Streaming AI responses is easy until something goes wrong. Maybe your user loses internet, or your server hiccups. 
      Suddenly, your beautiful real-time chat breaks. Lost messages and broken UX with no recovery. 
      I built a solution using Convex and the Vercel AI SDK that solves this with minimal complexity and no database spam.
      </P>
      <P>
        After evaluating several options, I decided to build on top of the Vercel AI SDK. 
        While it&#39;s not perfect out of the box, it&#39;s clean interface for LLM integration and structured generation made it the best foundation to build upon. 
        The challenge would be extending it to handle the persistence and reliability requirements of a production chat system.
      </P>

      <H2>Why I Picked the Vercel AI SDK (Despite Its Limits)</H2>
      <P>
        The <A href="https://sdk.vercel.ai">Vercel AI SDK</A> is great for swapping LLMs, structured generation, and a clean interface. But <code>useChat()</code> is limiting for production chat UIs that need custom streaming and persistence.
      </P>

      <H2>The F5 Problem</H2>
      <P>
        Most AI chat UIs fail the basic resilience test. Refresh the page mid-stream or lose internet? 
        You&#39;ve either lost the message or wait until its fully generated and then refresh the page to see it.
        <br/>
        Here&#39;s how some of today&#39;s top platforms stack up:
      </P>
      <div className="overflow-x-auto">
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
        To get both real-time streaming and persistence, you need to decouple the LLM stream from the HTTP request and persist every chunk. Most frameworks don&#39;t help you do this. The Vercel AI SDK assumes Node and Next.js API routes. If you use Convex or another backend, you end up streaming across systems, adding latency and risk.
      </P>

      <Blockquote>How does Convex help?</Blockquote>
      <P>
        <A href="https://convex.dev">Convex</A> lets you put LLM logic right next to your database. This means we have minimal network hops, and fast data operations.
      </P>

      <Blockquote>Saving Every Token?</Blockquote>
      <P>
        Saving every token chunk to Convex is too many writes. A job queue could help, but then you lose streaming. My solution: buffer tokens in memory and post a messagechunk to Convex every 200ms.
      </P>

      <H1 className='mt-8'>The Solution</H1>
      <P>
        Here&#39;s a breif overview of the solution I came up with. I&#39;ll go into more detail in the next section.
      </P>
      <UL>
        <LI>Define your message schema</LI>
        <LI>Start the chat with <code>startChatMessagePair</code></LI>
        <LI>Save the user&#39;s message and initiate the LLM response</LI>
        <LI>Generate the response in <code>internal.llm.generateAssistantMessage</code></LI>
        <LI>Use <code>useQuery</code> to stream the response</LI>
      </UL>

      <P>
        We&#39;re going to store the message chunks in the database, 
        but we&#39;re going to stream the tokens to the client as soon as they&#39;re generated.
      </P>

      <H2>1. Define your message schema</H2>
      <P>
        This is the schema I used for the chat. We&#39;re going to need a message thread, a message, and a message chunk.
        The message thread is just a title. The message is the user&#39;s message or the AI&#39;s response. The message chunk is a chunk of the AI&#39;s response.
      </P>
      <SyntaxHighligherWrapper
        text={
`const messageThreads = defineTable({
  title: v.string(),
}).index("by_title", ["title"]);

const messageChunks = defineTable({
  content: v.string(),
  messageId: v.id("messages"),
}).index("by_messageId", ["messageId""]);

const messages = defineTable({
  isComplete: v.optional(v.boolean()),
  role: v.union(v.literal("user"), v.literal("assistant")),
  threadId: v.id("messageThreads"),
}).index("by_threadId", ["threadId"]);

const userSettings = defineTable({
  userId: v.id("users"),
  role: v.union(v.literal("free"), v.literal("pro"), v.literal("admin")),
}).index("by_userId", ["userId"]);`} 
/>

      <H2>2. Start the chat with <code>startChatMessagePair</code>.</H2>
      <P>This Convex action:</P>
      <UL>
        <LI>Stores the user&#39;s message</LI>
        <LI>Creates a blank assistant message</LI>
        <LI>Immediately schedules a job to generate the reply</LI>
      </UL>
      <SyntaxHighligherWrapper
        text={
`// In your client component
const startChat = useAction(api.chat.startChatMessagePair);

const sendMessage = async () => {
  if (!input.trim()) return;

  setIsSending(true);

  await startChat({
    threadId,
    content: input,
  });

  setInput('');
  setIsSending(false);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await sendMessage();
  formRef.current?.reset();
};`} />
      <H2>2. Save the user&#39;s message and initiate the LLM response</H2>
      <P>This Convex action:</P>
      <UL>
        <LI>Stores the user&#39;s message</LI>
        <LI>Creates a blank assistant message</LI>
        <LI>Schedules the LLM job to generate the reply immediately</LI>
      </UL>
      <SyntaxHighligherWrapper
          text={
`export const startChatMessagePair = action({
  args: {
    threadId: v.id('messageThreads'),
    content: v.string(),
    saveId: v.id('saves'),
  },
  returns: v.object({
    assistantMessageId: v.id("messages"),
  }),
  handler: async (ctx, { threadId, content, saveId }) => {

    await ctx.runMutation(api.messages.createMessage, {
      threadId,
      role: 'user',
      content,
      isComplete: true,
    });

    const assistantMessageResult = await ctx.runMutation(api.messages.createMessage, {
      threadId,
      role: 'assistant',
      content: '',
      isComplete: false,
    });

    const assistantMessageId: Id<"messages"> = assistantMessageResult;

    // 3. Schedule the LLM job immediately
    await ctx.scheduler.runAfter(0, internal.llm.generateAssistantMessage, {
      threadId,
      content,
      assistantMessageId,
      saveId,
    });

    return { assistantMessageId };
  },
});

export const createMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    threadId: v.id("messageThreads"),
    isComplete: v.boolean(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const newMessageId = await ctx.db.insert("messages", {
      threadId: args.threadId as Id<"messageThreads">,
      role: args.role,
      isComplete: args.isComplete
    });

    if (args.content) {
      await ctx.db.insert("messageChunks", {
        messageId: newMessageId,
        content: args.content,
      });
    }

    return newMessageId;
  },
});`} />
      <H2>3. Generate the response in <code>internal.llm.generateAssistantMessage</code></H2>
      <P>This internal Convex action:</P>
      <UL>
        <LI>Uses <code>streamText()</code> from the Vercel AI SDK</LI>
        <LI>Streams tokens with <code>for await...of result.textStream</code></LI>
        <LI>Keeps them in memory</LI>
        <LI>Saves to Convex every 150ms</LI>
      </UL>
      <SyntaxHighligherWrapper

      text={
`// Minimum chunk size to reduce database writes
const MIN_CHUNK_SIZE = 20;
const FLUSH_INTERVAL = 200; // ms

export const generateAssistantMessage = internalAction({
  args: {
    threadId: v.id("messageThreads"),
    content: v.string(),
    assistantMessageId: v.id("messages"),
    saveId: v.id("saves"),
  },

  handler: async (ctx, args) => {
    try {
      const messages = await ctx.runQuery(api.messages.getMessages, {
        threadId: args.threadId,
      });

      const fullPrompt = [
        ...messages.map((m) => ({ 
          role: m.role, 
          content: m.messageChunks.map(chunk => chunk.content).join('') 
        })),
        { role: "user", content: args.content },
      ];

      const result = streamText({
        model: openai("gpt-4.1-mini"),
        system: \`You are helpful assistant.\`,
        messages: fullPrompt as CoreMessage[],
      });

      let buffer = "";
      let lastFlushTime = Date.now();
      let flushTimeout: NodeJS.Timeout | null = null;

      const flush = async (force = false) => {
        if (!force && (buffer.length < MIN_CHUNK_SIZE || Date.now() - lastFlushTime < FLUSH_INTERVAL)) {
          return;
        }

        if (buffer.length === 0) return;

        const contentToFlush = buffer;
        buffer = "";
        flushTimeout = null;
        lastFlushTime = Date.now();

        try {
          await ctx.runMutation(api.messages.createMessageChunk, {
            messageId: args.assistantMessageId,
            content: contentToFlush,
          });
        } catch (error) {
          console.error("Failed to save message chunk:", error);
          // In case of error, add content back to buffer
          buffer = contentToFlush + buffer;
          // Retry after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          await flush(true);
        }
      };

      for await (const chunk of result.textStream) {
        if (chunk) {
          buffer += chunk;
          
          // Schedule a flush if not already scheduled
          if (!flushTimeout) {
            flushTimeout = setTimeout(() => flush(), FLUSH_INTERVAL);
          }
          
          // Force flush if buffer gets too large
          if (buffer.length >= MIN_CHUNK_SIZE * 2) {
            if (flushTimeout) {
              clearTimeout(flushTimeout);
              flushTimeout = null;
            }
            await flush(true);
          }
        }
      }

      // Final cleanup
      if (flushTimeout) {
        clearTimeout(flushTimeout);
      }
      // Force flush any remaining content
      await flush(true);

      // Mark message as complete
      await ctx.runMutation(api.messages.updateMessage, {
        messageId: args.assistantMessageId,
        isComplete: true,
      });

    } catch (error) {
      console.error("Error in generateAssistantMessage:", error);
      
      // Mark message as complete but with error state
      await ctx.runMutation(api.messages.updateMessage, {
        messageId: args.assistantMessageId,
        isComplete: true,
      });
      
      // Add error message as final chunk
      await ctx.runMutation(api.messages.createMessageChunk, {
        messageId: args.assistantMessageId,
        content: "\\n\\nI apologize, but I encountered an error while generating the response. Please try again.",
      });
      
      throw error; // Re-throw to trigger Convex's error handling
    }
  },
});`} />

      <H2>4. Use <code>useQuery</code> to stream the response</H2>
      <P>
        Convex&#39;s <code>useQuery</code> is reactive, so it&#39;ll update as soon as the message is saved.
      </P>
      <SyntaxHighligherWrapper
        text={
`
// Convex query:
export const getMessages = query({
  args: { 
    threadId: v.id("messageThreads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get the most recent messages first, limited if specified
    const query = ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => 
        q.eq("threadId", args.threadId)
      )
      .order("desc");

    const messages = await (args.limit ? query.take(args.limit) : query.collect());
    messages.reverse(); // Put them back in chronological order

    // Fetch chunks for each message
    const messagesWithChunks = await Promise.all(
      messages.map(async (message) => {
        const chunks = await ctx.db
          .query("messageChunks")
          .withIndex("by_messageId", (q) => 
            q.eq("messageId", message._id)
          )
          .order("asc")
          .collect();
        
        return {
          ...message,
          messageChunks: chunks
        };
      })
    );

    return messagesWithChunks;
  },
});



// Client component
// Memoized Message component to optimize re-renders
const Message = memo(({ role, content, isComplete = true }: { 
  role: 'user' | 'assistant', 
  content: string, 
  isComplete?: boolean 
}) => (
  <div className={cn(
    "mb-4 flex w-full",
    role === "assistant" ? "justify-start" : "justify-end"
  )}>
    <div className={cn(
      "rounded-lg px-4 py-3",
      role === "assistant" 
        ? "w-full" 
        : "max-w-[90%] bg-primary text-primary-foreground"
    )}>
      <Markdown>{content}</Markdown>
      {!isComplete && (
        <span className="inline-block h-4 w-1 animate-pulse bg-current" />
      )}
    </div>
  </div>
));

//...

export default function Chat() {

  const messages = useQuery(api.messages.getMessages, { 
    threadId,
    limit: MESSAGE_LIMIT
  });

  /* Rest of the chat code. */
  return (
    <div>
    { /* ... */ }
      {messages?.map(message => (
        <Message
          key={message._id}
          role={message.role}
          content={message.messageChunks.map(chunk => chunk.content).join('')}
          isComplete={message.isComplete}
        />
      ))}
    </div>
  );
}`} />
      <H2>Results</H2>
      <P>
        After implementing this solution, I was able to achieve a simple implementation that provides a streaming feel even after disconnects while maintaining controlled database load.
        The system maintains message history, handles disconnects gracefully, and provides a smooth streaming experience without overwhelming the database since we capped the update rate at 150ms.
      </P>

      <div className="flex flex-col items-center mt-4 w-full">
        <div className="w-full max-w-[500px]">
          <Image
            unoptimized
            src={'/images/streaming-chat.gif'}
            alt="Streaming Chat"
            width={500}
            height={500}
            className="w-full h-auto"
            priority
          />
        </div>
        <Muted>
          Example of the streaming chat in action. The grey flashes are me refreshing the page
        </Muted>
      </div>

      <H2>Final Thoughts</H2>
      <P>
        If you&#39;re building real AI products, you can&#39;t afford to ignore resilience. 
        The risk of losing a message increases the longer your response takes.
        This system works well for me, but it&#39;s not a silver bullet. 
        If your use case demands token-level persistence (like hallucination tracking or audit logs), you&#39;ll need to tweak the flush cadence, or add extra logic.
      </P>
      <P>
        If you&#39;re building something real with AI don&#39;t just trust the magic SDKs. Understand what&#39;s happening under the hood. Own your infra.
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
        It&#39;s ambitious, but I&#39;ve never been more excited about a project.
      </P>
      <P>
        Also, if you&#39;re into TTRPGs, check out my side project: <A href="https://monsterlabs.app">MonsterLabs.app</A>, where you can create AI-driven monsters and items for D&amp;D.
        I also wrote about it <A href="/blog/monster-labs-1">here</A>.
      </P>
    </BlogPostLayout>
  );
}
