import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/send", "/live", "/blackbird", "/about", "/faq", "/how-it-works", "/status"],
      disallow: ["/c/", "/claim", "/history", "/api/"],
    },
  };
}
