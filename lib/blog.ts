import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type BlogPostMetadata = {
  slug: string;
  title: string;
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
    date: data.date ?? "",
    heroImage: data.heroImage,
    content,
  };
}

export function derivePostDescription(
  content: string,
  maxLength = 160
): string {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^#{1,6}\s/.test(trimmed)) continue;
    if (/^>/.test(trimmed)) continue;
    if (/^```/.test(trimmed)) continue;
    if (/^!\[[^\]]*\]\(/.test(trimmed)) continue;
    if (/^[-*]\s/.test(trimmed)) continue;
    if (/^\|/.test(trimmed)) continue;

    const text = trimmed
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[*_~`]+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 24) continue;
    if (text.length <= maxLength) return text;

    const limit = maxLength - 1;
    const sliced = text.slice(0, limit);
    const lastSpace = sliced.lastIndexOf(" ");
    const cut = lastSpace >= Math.floor(maxLength * 0.6) ? lastSpace : limit;
    return `${sliced.slice(0, cut)}…`;
  }

  return "A post by Arham Humayun.";
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
  // Date-only strings ("2026-10-06") parse as UTC midnight, which renders as
  // the previous day in timezones behind UTC. Parse them as local dates.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(dateString);
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
