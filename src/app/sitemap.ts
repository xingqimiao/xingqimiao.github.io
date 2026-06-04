import { MetadataRoute } from "next";
import compiledArticles from "@/data/compiled_articles.json";

export const dynamic = "force-static";

const BASE_URL = "https://kiraequal.org";

export default function sitemap(): MetadataRoute.Sitemap {
  // 1. Define all static routes
  const staticRoutes = [
    "",
    "/about",
    "/about-kiramyao",
    "/action",
    "/blog",
    "/join",
    "/privacy",
    "/report",
    "/story",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // 2. Safely map dynamic articles from compiled_articles.json
  // When automated scripts add new articles/pages to compiled_articles.json,
  // they will automatically be read here and added to the sitemap.xml.
  const dynamicRoutes = compiledArticles.map((article) => {
    // Map article types to their corresponding sub-path
    const typePath =
      article.type === "blog"
        ? "/blog"
        : article.type === "story"
        ? "/story"
        : "/report";

    // Try to parse the article's date (format: "YYYY.MM.DD") for lastModified
    let lastMod = new Date();
    if (article.date) {
      const parts = article.date.split(".");
      if (parts.length === 3) {
        const parsedDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        if (!isNaN(parsedDate.getTime())) {
          lastMod = parsedDate;
        }
      }
    }

    return {
      url: `${BASE_URL}${typePath}/${article.slug}`,
      lastModified: lastMod,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  return [...staticRoutes, ...dynamicRoutes];
}
