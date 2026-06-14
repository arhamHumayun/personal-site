import { FeaturedProject } from "@/components/home/FeaturedProject";
import { SectionHeading } from "@/components/home/SectionHeading";
import { A, P } from "@/components/typography";
import { WritingPostList } from "@/components/list/WritingPostList";
import { getAllPostsMetadata } from "@/lib/blog";
import Link from "next/link";

const FEATURED_SLUGS = ["tiny-ship", "monster-labs", "veilborn"];

async function getFeaturedProjects() {
  return Promise.all(
    FEATURED_SLUGS.map(async (slug) => {
      const mod = await import(`./projects/${slug}/page`);
      return {
        slug,
        title: mod.metadata.title,
        description: mod.metadata.cardDescription ?? mod.metadata.description,
        img: mod.metadata.img,
      };
    })
  );
}

export default async function Home() {
  const [featuredProjects, posts] = await Promise.all([
    getFeaturedProjects(),
    getAllPostsMetadata(),
  ]);

  const recentPosts = posts.slice(0, 3);

  return (
    <div className="w-full">
      <h1 className="sr-only">Arham Humayun</h1>
      <div className="text-foreground leading-relaxed">
        <P>
          Full-stack engineer at{" "}
          <A href="https://paceline.fit">Paceline</A>. I build AI tools and
          games.
        </P>
        <P>
          I think a lot about how systems work, both in code and in games. Right now
          I{`'`}m building{" "}
          <A href="/projects/tiny-ship">Tiny Ship</A>, a survivor-like twin-stick shooter, and{" "}
          <A href="/projects/monster-labs">Monster Labs</A>, an AI tool for D&D
          players.
        </P>
      </div>

      <SectionHeading>Featured</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {featuredProjects.map((project) => (
          <FeaturedProject
            key={project.slug}
            title={project.title}
            description={project.description}
            img={project.img}
            href={`/projects/${project.slug}`}
          />
        ))}
      </div>

      {recentPosts.length > 0 && (
        <>
          <SectionHeading>Writing</SectionHeading>
          <WritingPostList posts={recentPosts} />
          <Link
            href="/blog"
            className="inline-block mt-4 text-sm text-muted-foreground hover:text-link transition-colors"
          >
            All writing →
          </Link>
        </>
      )}
    </div>
  );
}
