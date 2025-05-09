import { A, H1, P } from "@/components/typography";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl">
      <H1>Hey there! 👋</H1>
      <P>
      I{`'`}m Arham Humayun, a Full-Stack Engineer passionate about APIs, React/Next.js, AI, and distributed systems.
      Currently working at <A href="https://blurb.fm">blurb.fm</A>, 
      a small startup that scales video creation to power music companies.
      </P>
      <P>
      I shipped <A href="https://monsterlabs.app">monsterlabs.app</A> as a side project. It{`'`}s a revenue generating SaaS that helps DnD players create their own monsters using AI.
      </P>
      <Link
        href="/blog"
        className="mt-8 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition"
        prefetch={true}
      >
        Read my blog
      </Link>
    </div>
  );
}

// 6cd0ce0a-aece-459a-a95b-e52e717ee1cf