import { describe, expect, test } from "vitest";
import {
  contentTypeForPath,
  publicFileFromHero,
  tryHeroImageResponse,
} from "./hero-share-image";

describe("hero share image", () => {
  test("maps cover extensions to content types", () => {
    expect(contentTypeForPath("/images/cover.jpg")).toBe("image/jpeg");
    expect(contentTypeForPath("/images/cover.jpeg")).toBe("image/jpeg");
    expect(contentTypeForPath("/images/cover.webp")).toBe("image/webp");
    expect(contentTypeForPath("/images/cover.png")).toBe("image/png");
  });

  test("resolves heroImage paths under public/", () => {
    expect(publicFileFromHero("/images/monsterlabs.webp")).toBe(
      `${process.cwd()}/public/images/monsterlabs.webp`
    );
  });

  test("returns the cover bytes when the file exists", async () => {
    const res = tryHeroImageResponse("/images/monsterlabs.webp");
    expect(res).not.toBeNull();
    expect(res?.headers.get("Content-Type")).toBe("image/webp");
    const buf = Buffer.from(await res!.arrayBuffer());
    expect(buf.length).toBeGreaterThan(1000);
  });

  test("returns null when there is no cover", () => {
    expect(tryHeroImageResponse(undefined)).toBeNull();
    expect(tryHeroImageResponse("/images/does-not-exist.jpg")).toBeNull();
  });
});
