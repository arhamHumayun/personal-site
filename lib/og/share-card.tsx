import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";
import { formatPostDate } from "@/lib/blog";
import { ogTheme } from "@/lib/og/theme";

export const OG_SIZE = {
  width: 1200,
  height: 630,
};

function loadOgFonts() {
  const dir = join(process.cwd(), "lib/og/fonts");
  return [
    {
      name: "Inter",
      data: readFileSync(join(dir, "Inter-Bold.ttf")),
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "IBM Plex Mono",
      data: readFileSync(join(dir, "IBMPlexMono-Medium.ttf")),
      weight: 500 as const,
      style: "normal" as const,
    },
  ];
}

const ASCII_CHARS = " .:-=+*#%@";

function asciiDiceColumn(offset: number): string {
  const width = 14;
  const height = 38;
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const d1 = Math.hypot(x - 6.5, (y - 9 - offset) * 0.9);
      const d2 = Math.hypot(x - 6.5, (y - 26 + offset) * 0.9);
      const d = Math.min(d1, d2);
      const v = Math.max(0, 1 - d / 6.2);
      const pip =
        Math.hypot(x - 5, y - (d1 < d2 ? 8 : 25)) < 0.85 ||
        Math.hypot(x - 8, y - (d1 < d2 ? 11 : 28)) < 0.85
          ? 0.35
          : 1;
      const idx = Math.min(
        ASCII_CHARS.length - 1,
        Math.floor(v * v * pip * ASCII_CHARS.length)
      );
      line += ASCII_CHARS[idx];
    }
    lines.push(line);
  }

  return lines.join("\n");
}

const ASCII_LEFT = asciiDiceColumn(0);
const ASCII_RIGHT = asciiDiceColumn(1);

function titleFontSize(title: string) {
  if (title.length > 70) return 42;
  if (title.length > 50) return 48;
  if (title.length > 32) return 56;
  return 64;
}

type BlogShareImageProps = {
  title: string;
  date?: string;
  slug: string;
};

export function renderBlogShareImage({
  title,
  date,
  slug,
}: BlogShareImageProps) {
  const dateText = date ? formatPostDate(date, "compact") : "";
  const navPath = `~/writing/${slug}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: ogTheme.background,
          backgroundImage:
            "radial-gradient(circle, rgba(187,184,163,0.55) 0.65px, transparent 0.65px)",
          backgroundSize: "20px 20px",
          color: ogTheme.foreground,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 168,
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "IBM Plex Mono",
            fontSize: 13,
            lineHeight: 1.15,
            color: ogTheme.mutedForeground,
            opacity: 0.28,
            whiteSpace: "pre",
          }}
        >
          {ASCII_LEFT}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            height: "100%",
            borderLeft: `1px solid ${ogTheme.border}`,
            borderRight: `1px solid ${ogTheme.border}`,
            backgroundColor: ogTheme.background,
            padding: "40px 48px 36px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Inter",
                fontSize: 28,
                fontWeight: 700,
                color: ogTheme.foreground,
              }}
            >
              Arham Humayun
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                fontFamily: "IBM Plex Mono",
                fontSize: 18,
                color: ogTheme.mutedForeground,
                letterSpacing: 1,
              }}
            >
              {navPath}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              height: 1,
              width: "100%",
              marginTop: 28,
              backgroundColor: ogTheme.border,
              opacity: 0.5,
            }}
          />

          {dateText ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 36,
                fontFamily: "IBM Plex Mono",
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: ogTheme.mutedForeground,
              }}
            >
              <span style={{ color: ogTheme.link, opacity: 0.7 }}>DATE</span>
              <span style={{ color: ogTheme.border }}>·</span>
              <span>{dateText}</span>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Inter",
                fontSize: titleFontSize(title),
                fontWeight: 700,
                lineHeight: 1.15,
                color: ogTheme.foreground,
                maxWidth: 780,
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "IBM Plex Mono",
              fontSize: 20,
              color: ogTheme.mutedForeground,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                backgroundColor: ogTheme.link,
              }}
            />
            <span>arhamhumayun.com</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: 168,
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "IBM Plex Mono",
            fontSize: 13,
            lineHeight: 1.15,
            color: ogTheme.mutedForeground,
            opacity: 0.28,
            whiteSpace: "pre",
          }}
        >
          {ASCII_RIGHT}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: loadOgFonts(),
    }
  );
}
