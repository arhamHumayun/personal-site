import { existsSync, readFileSync } from "fs";
import { extname, join } from "path";
import { NextResponse } from "next/server";

export function contentTypeForPath(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".png":
    default:
      return "image/png";
  }
}

export function publicFileFromHero(heroImage: string): string {
  return join(process.cwd(), "public", heroImage.replace(/^\//, ""));
}

export function tryHeroImageResponse(
  heroImage: string | undefined
): NextResponse | null {
  if (!heroImage) return null;

  const file = publicFileFromHero(heroImage);
  if (!existsSync(file)) return null;

  return new NextResponse(new Uint8Array(readFileSync(file)), {
    headers: {
      "Content-Type": contentTypeForPath(file),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
