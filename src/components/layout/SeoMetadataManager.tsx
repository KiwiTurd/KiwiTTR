import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { pathMatches, SEO_PAGES } from "../../config/seoPages";
import { getSeoMetadata } from "../../services/supabase/seoMetadataService";
import type { SeoMetadata } from "../../types/seoMetadata";

function setMeta(name: string, content: string, property = false) {
  const attribute = property ? "property" : "name";
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.content = content;
}

export default function SeoMetadataManager() {
  const { pathname } = useLocation();
  const [saved, setSaved] = useState<SeoMetadata[]>([]);

  useEffect(() => {
    void getSeoMetadata()
      .then(setSaved)
      .catch((error) => console.warn("SEO metadata is using local defaults.", error));
  }, []);

  useEffect(() => {
    const definition = SEO_PAGES.find((page) => pathMatches(page.path, pathname));
    if (!definition) return;

    const custom = saved.find((item) => item.path === definition.path);
    const title = custom?.title || definition.title;
    const description = custom?.description || definition.description;
    const keywords = custom?.keywords.filter(Boolean).join(", ") || definition.keywords.join(", ");
    const image = custom?.imageUrl || "";

    document.title = title;
    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    if (image) {
      setMeta("og:image", image, true);
      setMeta("twitter:image", image);
    }
  }, [pathname, saved]);

  return null;
}
