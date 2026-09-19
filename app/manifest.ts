import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LunchDrop",
    short_name: "LunchDrop",
    description: "Send someone lunch with Blackbird and Flynet.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e6",
    theme_color: "#f7d93d",
    icons: [
      { src: "/lunchdrop-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
