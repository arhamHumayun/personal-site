import { P } from "@/components/typography";
import Link from "next/link";
import { formatPostDate, getAllPostsMetadata } from "@/lib/blog";

export default async function Blog() {
  const sortedPosts = await getAllPostsMetadata();

  return (
    <div className="w-full">
      <h1 className="sr-only">Writing</h1>
      <div className="space-y-0">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.slug}
              className="group block py-4 border-b border-border last:border-0 focus-visible:ring-2 focus-visible:ring-ring/50 outline-none rounded-sm"
            >
              <div className="flex justify-between gap-4 items-baseline">
                <h2 className="text-lg font-semibold group-hover:underline underline-offset-4">
                  {post.title}
                </h2>
                {post.date && (
                  <span className="text-sm text-muted-foreground shrink-0">
                    {formatPostDate(post.date)}
                  </span>
                )}
              </div>
              <P className="mt-1 text-sm text-muted-foreground">{post.description}</P>
            </Link>
          ))
        ) : (
          <P>No posts yet.</P>
        )}
      </div>
    </div>
  );
}
