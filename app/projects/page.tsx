import { ProjectGrid } from "@/components/list/ProjectGrid";
import fs from "fs";
import path from "path";

/** Slugs listed first (in order); remaining projects follow alphabetically by slug. */
const PROJECT_SLUG_PRIORITY: string[] = ["tiny-ship", "monster-labs", "veilborn"];

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

async function getProjectSlugs() {
  const projectsDirectory = path.join(process.cwd(), "app/projects");
  const dirents = await fs.promises.readdir(projectsDirectory, {
    withFileTypes: true,
  });
  const slugs = dirents
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
  return sortProjectSlugs(slugs);
}

async function getProjectMetadata(slug: string) {
  try {
    const mod = await import(`./${slug}/page`);
    return { slug, ...mod.metadata };
  } catch {
    return {
      slug,
      title: slug,
      description: "No description.",
      img: "",
      url: "",
    };
  }
}

export default async function Projects() {
  const slugs = await getProjectSlugs();
  const projects = await Promise.all(slugs.map((slug) => getProjectMetadata(slug)));

  const gridProjects = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    description: project.cardDescription ?? project.description,
    img: project.img,
  }));

  return (
    <div className="w-full">
      <h1 className="sr-only">Projects</h1>
      <ProjectGrid projects={gridProjects} showIndex />
    </div>
  );
}
