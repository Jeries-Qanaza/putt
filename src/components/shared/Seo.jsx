import { useEffect } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_SITE_NAME,
  buildLocale,
  buildTitle,
  clampDescription,
} from '@/lib/seo';

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null || value === false) return;
    element.setAttribute(key, String(value));
  });
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null || value === false) return;
    element.setAttribute(key, String(value));
  });
}

export default function Seo({
  title,
  description,
  canonical,
  image,
  type = 'website',
  robots = 'index,follow',
  lang = 'en',
  jsonLd = [],
}) {
  useEffect(() => {
    const nextTitle = buildTitle(title);
    const nextDescription = clampDescription(description, DEFAULT_DESCRIPTION);
    const nextImage = image || DEFAULT_OG_IMAGE;
    const nextLocale = buildLocale(lang);
    const entries = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd].filter(Boolean);

    document.title = nextTitle;

    upsertMeta('meta[name="description"]', { name: 'description', content: nextDescription });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: nextTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: nextDescription });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: DEFAULT_SITE_NAME });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: nextLocale });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: nextImage });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: nextTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: nextDescription });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: nextImage });

    if (canonical) {
      upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });
      upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    }

    document.head
      .querySelectorAll('script[data-seo-managed="true"]')
      .forEach((node) => node.remove());

    entries.forEach((entry) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-managed', 'true');
      script.textContent = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [canonical, description, image, jsonLd, lang, robots, title, type]);

  return null;
}
