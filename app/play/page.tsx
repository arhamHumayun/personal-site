import fs from "fs";
import Link from "next/link";
import path from "path";

async function getGames() {
  const dir = path.join(process.cwd(), "app/play");
  const slugs = (await fs.promises.readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  return Promise.all(
    slugs.map(async (slug) => {
      const { metadata } = await import(`./${slug}/page`);
      return { slug, title: metadata.title as string };
    }),
  );
}

export const metadata = { title: "Play" };

const PINNED = [
  {
    title: "Tiny Ship",
    href: "https://arham99.itch.io/tiny-ship",
    external: true,
  },
];

export default async function Play() {
  const games = await getGames();
  const items = [
    ...PINNED,
    ...games.map((game) => ({
      title: game.title,
      href: `/play/${game.slug}`,
      external: false,
    })),
  ];

  return (
    <div className="w-full">
      <h1 className="sr-only">Play</h1>
      {items.map((item, i) => (
        <div key={item.href}>
          <Link
            href={item.href}
            {...(item.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="group block py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <h2 className="font-semibold underline-offset-4 group-hover:underline">{item.title}</h2>
          </Link>
          {i < items.length - 1 && <div className="h-px bg-border" aria-hidden />}
        </div>
      ))}
    </div>
  );
}
