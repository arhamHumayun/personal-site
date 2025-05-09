import { H2, P } from "@/components/typography";
import fs from "fs";
import path from "path";
import Link from "next/link";

// Function to get all blog post slugs
async function getPostSlugs() {
  const postsDirectory = path.join(process.cwd(), "app/blog");
  // Filter out files, keep only directories, and exclude the root 'blog' page itself if structured differently
  const Dirents = await fs.promises.readdir(postsDirectory, { withFileTypes: true });
  // Check if the ent is a directory and not a special file/directory like .git or node_modules
  const directories = Dirents.filter(
    (dirent) => dirent.isDirectory() && !dirent.name.startsWith('.') && !dirent.name.startsWith('_')
  );
  return directories.map((dirent) => dirent.name);
}

// Function to get metadata for a single post
async function getPostMetadata(slug: string) {
  try {
    // Dynamically import the page module to access its metadata
    // Ensure the path is correct based on your project structure
    const postModule = await import(`./${slug}/page`);
    // Assuming each post page exports a 'metadata' object
    // and has a default export component
    return {
      slug,
      ...(postModule.metadata || {}), // Spread the metadata from the module
      // Add default values or handle missing metadata as needed
      title: postModule.metadata?.title || slug.replace(/-/g, ' '),
      description: postModule.metadata?.description || "No description provided.",
    };
  } catch (error) {
    console.error(`Failed to load metadata for post: ${slug}`, error);
    // Return a default/error state or null
    return {
      slug,
      title: slug.replace(/-/g, ' '),
      description: "Could not load post details.",
      error: true,
    };
  }
}

// Simple date formatting function
function formatDate(dateString: string | undefined) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function Blog() {
  const slugs = await getPostSlugs();
  const postsMetadata = await Promise.all(
    slugs.map(slug => getPostMetadata(slug))
  );

  // Filter out any posts that had errors loading metadata
  const validPosts = postsMetadata.filter(post => !post.error);

  // Sort posts by date, most recent first
  const sortedPosts = validPosts.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="max-w-3xl mx-auto">
      <H2>Blog</H2>
      {/* List of blog posts */}
      <div className="mt-4 space-y-8">
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post, idx) => (
            <Link
              href={`/blog/${post.slug}`}
              prefetch={true}
              key={post.slug}
              className="block rounded-lg transition-colors w-full focus-visible:ring-2 focus-visible:ring-primary/50 outline-none"
            >
              <div className="flex items-start gap-6 w-full">
                {/* Timeline date and line */}
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-sm text-muted-foreground font-medium mb-2">
                    {post.date ? formatDate(post.date) : ''}
                  </span>
                  {/* Vertical line for timeline, except for last post */}
                  {idx !== sortedPosts.length - 1 && (
                    <span className="block w-px flex-1 bg-muted-foreground/20" style={{ minHeight: '2.5rem' }} />
                  )}
                </div>
                {/* Post content */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold hover:underline">{post.title}</h3>
                  <P>{post.description}.</P>
                  {idx !== sortedPosts.length - 1 && (
                    <hr className="my-6 border-t border-muted-foreground/20" />
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <P>No blog posts found yet.</P>
        )}
      </div>
    </div>
  );
}