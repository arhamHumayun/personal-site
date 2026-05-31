import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlogPostLayout } from "@/components/blog/BlogPostLayout";
import { BlogPostHeader } from "@/components/blog/BlogPostHeader";
import { MarkdownPostContent } from "@/components/blog/MarkdownPostContent";
import {
  getMarkdownPost,
  getMarkdownPostSlugs,
  getTsxPostSlugs,
} from "@/lib/blog";

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

  return {
    title: post.title,
    description: post.description,
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
        description={post.description}
        date={post.date}
        heroImage={post.heroImage}
      />
      <MarkdownPostContent content={post.content} />
    </BlogPostLayout>
  );
}
