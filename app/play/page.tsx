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
      return { slug, title: metadata.title as string, description: metadata.description as string };
    }),
  );
}

export const metadata = { title: "Play" };

export default async function Play() {
  const games = await getGames();

  return (
    <div className="w-full">
      <h1 className="sr-only">Play</h1>
      {games.map((game, i) => (
        <div key={game.slug}>
          <Link
            href={`/play/${game.slug}`}
            className="group flex items-baseline justify-between gap-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <h2 className="font-semibold underline-offset-4 group-hover:underline">{game.title}</h2>
            <p className="text-right text-sm text-muted-foreground">{game.description}</p>
          </Link>
          {i < games.length - 1 && <div className="h-px bg-border" aria-hidden />}
        </div>
      ))}
    </div>
  );
}
