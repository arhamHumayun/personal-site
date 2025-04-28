import { H1, Lead, P } from "@/components/typography";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center space-y-6 max-w-2xl">
        <H1>Hey there! 👋</H1>
        <Lead>Welcome to my personal website. I&#39;m Arham Humayun, a Full-Stack Engineer with startup experience, specializing in backend development, AI systems, and distributed architectures.</Lead>
        <P>Feel free to explore my blog posts, check out my projects, or get in touch!</P>
        <div className="flex justify-center space-x-4 mt-8">
          <Link href="/blog" prefetch={true} className="text-primary hover:underline">
            Read my blog
          </Link>
          <Link href="/projects" prefetch={true} className="text-primary hover:underline">
            View my projects
          </Link>
          <Link href="/contact" prefetch={true} className="text-primary hover:underline">
            Get in touch
          </Link>
        </div>
      </div>
    </div>
  );
}
