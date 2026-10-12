/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  const bg = "#f7f7fb";
  const fg = "#1f2340";
  const muted = "#68708a";
  const accent = "#5b5fe5";
  const card = "#ffffff";
  const border = "rgba(0,0,0,0.08)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: bg,
          position: "relative",
          padding: 48,
          boxSizing: "border-box",
        }}
      >
        {/* subtle background accents */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(1200px 630px at -10% 110%, rgba(91,95,229,0.08), transparent 60%), radial-gradient(900px 600px at 110% -10%, rgba(91,95,229,0.08), transparent 50%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Header strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: muted,
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: accent,
                boxShadow: "0 0 0 4px rgba(91,95,229,0.18)",
              }}
            />
            <span style={{ fontWeight: 600 }}>Arham Humayun</span>
          </div>

          {/* Card with title */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              borderRadius: 24,
              border: `1px solid ${border}`,
              background: card,
              boxShadow:
                "inset 0 0 0 1px rgba(0,0,0,0.03), 0 10px 40px rgba(0,0,0,0.06)",
              padding: 48,
              marginTop: 24,
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Accent bar */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 8,
                background: accent,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <h1
                style={{
                  fontSize: 72,
                  lineHeight: 1.1,
                  color: fg,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                arhamhumayun.com
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 32,
                  color: muted,
                  maxWidth: 900,
                }}
              >
                Software, games, and AI projects.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: muted,
              fontSize: 28,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: accent,
                  boxShadow: "0 2px 10px rgba(91,95,229,0.35)",
                }}
              />
              <span style={{ fontWeight: 600, color: fg }}>
                arhamhumayun.com
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>Follow on</span>
              <span style={{ fontWeight: 600, color: fg }}>X / LinkedIn</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

