import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/config/brand";
import { OG_SIZE } from "@/lib/config/site";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * Social preview (WhatsApp, LinkedIn, X, Slack…) at a stable URL, /og, so every page can reference it.
 * Logo mark + name on the brand's white / teal / gold palette. Static: rendered once at build time.
 */
export async function GET() {
  const mark = await readFile(join(process.cwd(), "public", "assets", "synq-mark.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 96px",
          background: "#f8fbfa",
          borderBottom: "12px solid #c9af6f",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
        <img src={markSrc} width={260} height={260} alt="" style={{ marginRight: 64 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 700, color: "#114c61", letterSpacing: -2 }}>{BRAND.name}</div>
          <div style={{ marginTop: 16, fontSize: 40, color: "#2b7080" }}>Guided mental wellbeing</div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#3c5864", maxWidth: 640 }}>
            A private space to understand how you feel, between consultations.
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
