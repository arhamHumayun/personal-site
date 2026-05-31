import ProjectCard from "@/components/ui/ProjectCard";
import fs from "fs";
import path from "path";

/** Slugs listed first (in order); remaining projects follow alphabetically by slug. */
const PROJECT_SLUG_PRIORITY: string[] = ["tiny-ship", "monster-labs"];

function sortProjectSlugs(slugs: string[]) {
  return [...slugs].sort((a, b) => {
    const pa = PROJECT_SLUG_PRIORITY.indexOf(a);
    const pb = PROJECT_SLUG_PRIORITY.indexOf(b);
    const ra = pa === -1 ? Number.MAX_SAFE_INTEGER : pa;
    const rb = pb === -1 ? Number.MAX_SAFE_INTEGER : pb;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

// Get all project slugs (folder names)
async function getProjectSlugs() {
  const projectsDirectory = path.join(process.cwd(), "app/projects");
  const dirents = await fs.promises.readdir(projectsDirectory, { withFileTypes: true });
  const slugs = dirents.filter(d => d.isDirectory() && !d.name.startsWith("."))
    .map(d => d.name);
  return sortProjectSlugs(slugs);
}

// Get metadata for a single project
async function getProjectMetadata(slug: string) {
  try {
    const mod = await import(`./${slug}/page`);
    return { slug, ...mod.metadata };
  } catch {
    return { slug, title: slug, description: "No description.", img: "", url: "" };
  }
}

export default async function Projects() {
  const slugs = await getProjectSlugs();
  const projects = await Promise.all(slugs.map(slug => getProjectMetadata(slug)));

  return (
    <div className="w-full">
      <h1 className="sr-only">Projects</h1>
      <div>
        {projects.map((project) => (
          <ProjectCard
            key={project.slug}
            title={project.title}
            img={project.img}
            desc={project.cardDescription ?? project.description}
            url={`/projects/${project.slug}`}
          />
        ))}
      </div>
    </div>
  );
}