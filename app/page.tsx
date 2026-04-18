import { A, H1, P } from "@/components/typography";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col justify-center h-full max-w-2xl">
      <H1 className="text-center">Hey there! 👋</H1>
      <P>
      I{`'`}m Arham Humayun, a Full-Stack Engineer passionate about APIs, React/Next.js, AI, and distributed systems.
      I currently work at <A href="https://paceline.fit">Paceline</A> as a Full-Stack Engineer.
      </P>
      <P>
      I shipped <A href="https://monsterlabs.app">monsterlabs.app</A> as a side project. It{`'`}s a revenue generating SaaS that helps DnD players create their own monsters using AI.
      </P>
      <P>
        I{`'`}m working on a videogame called <A href="https://arham99.itch.io/tiny-ship">Tiny Ship</A>. It's playable on web, check it out!
      </P>
    </div>
  );
}
