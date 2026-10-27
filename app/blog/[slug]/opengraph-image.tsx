import { getPostMetadata } from "@/lib/blog";
import { OG_SIZE, renderBlogShareImage } from "@/lib/og/share-card";

export const alt = "Arham Humayun blog post";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";

type ImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const post = slug ? await getPostMetadata(slug) : null;

  return renderBlogShareImage({
    title: post?.title ?? "Blog Post",
    date: post?.date,
    slug: slug || "post",
  });
}
