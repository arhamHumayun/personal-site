export const NAV_PATHS = {
  home: "~/home",
  writing: "~/writing",
  projects: "~/projects",
  contact: "~/contact",
} as const;

export function getCurrentNavPath(pathname: string): string {
  if (!pathname || pathname === "/") return NAV_PATHS.home;

  if (pathname === "/blog") return NAV_PATHS.writing;
  if (pathname.startsWith("/blog/")) {
    return `${NAV_PATHS.writing}/${pathname.slice("/blog/".length)}`;
  }

  if (pathname === "/projects") return NAV_PATHS.projects;
  if (pathname.startsWith("/projects/")) {
    return `${NAV_PATHS.projects}/${pathname.slice("/projects/".length)}`;
  }

  if (pathname === "/contact") return NAV_PATHS.contact;

  return `~${pathname}`;
}

export const navItems = [
  { label: "Writing", href: "/blog", path: NAV_PATHS.writing },
  { label: "Projects", href: "/projects", path: NAV_PATHS.projects },
  { label: "Contact", href: "/contact", path: NAV_PATHS.contact },
] as const;
