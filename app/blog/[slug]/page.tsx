import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlogPostLayout } from "@/components/blog/BlogPostLayout";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { MarkdownPostContent } from "@/components/blog/MarkdownPostContent";
import {
  derivePostDescription,
  getMarkdownPost,
  getMarkdownPostSlugs,
  getTsxPostSlugs,
} from "@/lib/blog";
import { contentTypeForPath } from "@/lib/og/hero-share-image";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const tsxSlugs = new Set(getTsxPostSlugs());

  return getMarkdownPostSlugs()
    .filter((slug) => !tsxSlugs.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getMarkdownPost(slug);

  if (!post) {
    return { title: "Post not found" };
  }

  const description = derivePostDescription(post.content);
  const coverImages = post.heroImage
    ? [
        {
          url: post.heroImage,
          alt: post.title,
          type: contentTypeForPath(post.heroImage),
        },
      ]
    : undefined;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      siteName: "Arham Humayun",
      locale: "en_US",
      ...(coverImages ? { images: coverImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      ...(coverImages ? { images: coverImages } : {}),
    },
  };
}

export default async function MarkdownBlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getMarkdownPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <BlogPostLayout>
      <BlogPostHeader
        title={post.title}
        date={post.date}
        heroImage={post.heroImage}
      />
      <MarkdownPostContent content={post.content} />
    </BlogPostLayout>
  );
}
