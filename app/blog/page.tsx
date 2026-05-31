import { WritingPostList } from "@/components/list/WritingPostList";
import { getAllPostsMetadata } from "@/lib/blog";

export default async function Blog() {
  const sortedPosts = await getAllPostsMetadata();

  return (
    <div className="w-full">
      <h1 className="sr-only">Writing</h1>
      <WritingPostList posts={sortedPosts} />
    </div>
  );
}
