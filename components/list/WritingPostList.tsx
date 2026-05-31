import { P } from "@/components/typography";
import type { BlogPostMetadata } from "@/lib/blog";
import { WritingPostLink } from "./WritingPostLink";

interface WritingPostListProps {
  posts: BlogPostMetadata[];
}

export function WritingPostList({ posts }: WritingPostListProps) {
  if (posts.length === 0) {
    return <P>No posts yet.</P>;
  }

  return (
    <div>
      {posts.map((post, index) => (
        <div key={post.slug}>
          <WritingPostLink
            slug={post.slug}
            title={post.title}
            description={post.description}
            date={post.date}
          />
          {index < posts.length - 1 && (
            <div className="h-px bg-border rounded-none" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
