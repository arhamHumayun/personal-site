import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type BlogPostMetadata = {
  slug: string;
  title: string;
  description: string;
  date: string;
  heroImage?: string;
};

export type MarkdownPost = BlogPostMetadata & {
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content/blog");
const TSX_BLOG_DIR = path.join(process.cwd(), "app/blog");

export function getTsxPostSlugs(): string[] {
  const dirents = fs.readdirSync(TSX_BLOG_DIR, { withFileTypes: true });
  return dirents
    .filter(
      (dirent) =>
        dirent.isDirectory() &&
        !dirent.name.startsWith(".") &&
        !dirent.name.startsWith("_") &&
        dirent.name !== "[slug]"
    )
    .map((dirent) => dirent.name);
}

export function getMarkdownPostSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getAllPostSlugs(): string[] {
  const tsxSlugs = getTsxPostSlugs();
  const markdownSlugs = getMarkdownPostSlugs().filter(
    (slug) => !tsxSlugs.includes(slug)
  );

  return [...tsxSlugs, ...markdownSlugs];
}

export async function getTsxPostMetadata(
  slug: string
): Promise<BlogPostMetadata | null> {
  try {
    const postModule = await import(`@/app/blog/${slug}/page`);
    const metadata = postModule.metadata ?? {};

    return {
      slug,
      title: metadata.title ?? slug.replace(/-/g, " "),
      description: metadata.description ?? "No description provided.",
      date: metadata.date ?? "",
      heroImage: metadata.heroImage,
    };
  } catch {
    return null;
  }
}

export function getMarkdownPost(slug: string): MarkdownPost | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug.replace(/-/g, " "),
    description: data.description ?? "No description provided.",
    date: data.date ?? "",
    heroImage: data.heroImage,
    content,
  };
}

export async function getPostMetadata(
  slug: string
): Promise<BlogPostMetadata | null> {
  const tsxMetadata = await getTsxPostMetadata(slug);
  if (tsxMetadata) {
    return tsxMetadata;
  }

  const markdownPost = getMarkdownPost(slug);
  if (!markdownPost) {
    return null;
  }

  const { content: _content, ...metadata } = markdownPost;
  return metadata;
}

export function formatPostDate(
  dateString: string | undefined,
  variant: "long" | "compact" = "long"
) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  if (variant === "compact") {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function getAllPostsMetadata(): Promise<BlogPostMetadata[]> {
  const slugs = getAllPostSlugs();
  const posts = await Promise.all(slugs.map((slug) => getPostMetadata(slug)));

  return posts
    .filter((post): post is BlogPostMetadata => post !== null)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}
