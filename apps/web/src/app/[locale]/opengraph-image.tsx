import { ImageResponse } from "next/og";
import { BRAND, BrandMark } from "@/lib/brand-mark";

export const alt = "Coding Foding — Learn how to learn";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Outfit (brand font) at one weight as TTF (the OG renderer can't read woff2); null offline. */
async function brandFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Outfit:wght@${weight}`,
    ).then((r) => r.text());
    const url = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
    )?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/**
 * Link-preview card. English only: the OG renderer ships a Latin font, so
 * Bangla would come out as boxes — the brand line reads fine in both locales.
 */
export default async function OpengraphImage() {
  const [light, bold] = await Promise.all([brandFont(300), brandFont(800)]);
  const fonts = [
    ...(light ? [{ name: "Outfit", data: light, weight: 300 as const }] : []),
    ...(bold ? [{ name: "Outfit", data: bold, weight: 800 as const }] : []),
  ];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: BRAND.ink,
        color: BRAND.walker,
        fontFamily: "Outfit",
        fontWeight: 300,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <BrandMark size={150} />
        <div
          style={{
            display: "flex",
            fontFamily: "Outfit",
            fontSize: 92,
            letterSpacing: -3,
          }}
        >
          <span style={{ fontWeight: 300, color: BRAND.muted }}>coding</span>
          <span style={{ display: "flex", fontWeight: 800 }}>
            fod
            <span style={{ display: "flex", position: "relative" }}>
              ı
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  left: "50%",
                  width: 18,
                  height: 18,
                  marginLeft: -9,
                  borderRadius: 9,
                  background: BRAND.crack,
                }}
              />
            </span>
            ng
          </span>
        </div>
      </div>
      <div style={{ marginTop: 48, fontSize: 44, opacity: 0.9 }}>
        Learn how to learn — one path, small steps.
      </div>
      <div
        style={{
          marginTop: 20,
          fontSize: 28,
          letterSpacing: 4,
          color: BRAND.crack,
        }}
      >
        {"</> WHY → CODE → CRACK"}
      </div>
    </div>,
    { ...size, fonts },
  );
}
