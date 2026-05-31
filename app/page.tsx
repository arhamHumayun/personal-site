import { FeaturedProject } from "@/components/home/FeaturedProject";
import { SectionHeading } from "@/components/home/SectionHeading";
import { A, P } from "@/components/typography";
import { formatPostDate, getAllPostsMetadata } from "@/lib/blog";
import Link from "next/link";

const FEATURED_SLUGS = ["tiny-ship", "monster-labs"];

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
          <A href="/projects/tiny-ship">Tiny Ship</A>, a twin-stick shooter I
          can actually finish, and{" "}
          <A href="/projects/monster-labs">Monster Labs</A>, an AI tool for DnD
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
          <div>
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block py-4 border-b border-border last:border-0"
              >
                <div className="flex justify-between gap-4 items-baseline">
                  <h3 className="font-semibold group-hover:underline underline-offset-4">
                    {post.title}
                  </h3>
                  {post.date && (
                    <span className="text-sm text-muted-foreground shrink-0">
                      {formatPostDate(post.date)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
              </Link>
            ))}
          </div>
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
