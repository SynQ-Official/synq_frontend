import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/",
    // "browser": the site is not offered as an installable app; the manifest only supplies icons and the theme colour.
    display: "browser",
    background_color: "#f8fbfa",
    theme_color: "#114c61",
    icons: [
      { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
