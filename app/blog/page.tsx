import { H1, H2, P } from "@/components/typography";
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


export default async function Blog() {
  const slugs = await getPostSlugs();
  const postsMetadata = await Promise.all(
    slugs.map(slug => getPostMetadata(slug))
  );

  // Filter out any posts that had errors loading metadata
  const validPosts = postsMetadata.filter(post => !post.error);


  return (
    <div>
      <H2>Blog</H2>
      <P>
        I write about my experiences and thoughts on my blog. Here are some entries:
      </P>
      {/* List of blog posts */}
      <div className="mt-4 space-y-4">
        {validPosts.length > 0 ? (
          validPosts.map((post) => (
            <div key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                 {/* Use a more descriptive element or style as needed */}
                <h3 className="text-xl font-semibold hover:underline">{post.title}</h3>
              </Link>
              <P>{post.description}</P>
            </div>
          ))
        ) : (
          <P>No blog posts found yet.</P>
        )}
      </div>
    </div>
  );
}