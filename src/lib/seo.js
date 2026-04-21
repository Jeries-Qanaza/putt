export const DEFAULT_SITE_NAME = 'Putt';
export const DEFAULT_DESCRIPTION =
  'Putt helps people discover restaurants, browse menus, and find useful dining details in one place.';
export const DEFAULT_OG_IMAGE =
  'https://excmyttiqgchkbxlhaps.supabase.co/storage/v1/object/public/putt-assets/restaurants_logos/putt_logo.png';

export function getSiteOrigin() {
  const configured =
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.NEXT_PUBLIC_SITE_URL ||
    '';

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return '';
}

export function toAbsoluteUrl(path = '/') {
  const origin = getSiteOrigin();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}

export function buildTitle(title) {
  if (!title || title === DEFAULT_SITE_NAME) return DEFAULT_SITE_NAME;
  return `${title}-${DEFAULT_SITE_NAME}`;
}

export function clampDescription(value, fallback = DEFAULT_DESCRIPTION) {
  const text = String(value || fallback || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).trimEnd()}...`;
}

export function buildLocale(lang) {
  switch (lang) {
    case 'he':
      return 'he_IL';
    case 'ar':
      return 'ar_IL';
    default:
      return 'en_US';
  }
}

export function scheduleToOpeningHoursSpecification(schedule = {}) {
  const dayMap = {
    Sun: 'https://schema.org/Sunday',
    Mon: 'https://schema.org/Monday',
    Tue: 'https://schema.org/Tuesday',
    Wed: 'https://schema.org/Wednesday',
    Thu: 'https://schema.org/Thursday',
    Fri: 'https://schema.org/Friday',
    Sat: 'https://schema.org/Saturday',
  };

  return Object.entries(schedule)
    .filter(([, row]) => row && !row.closed && row.open && row.close)
    .map(([day, row]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dayMap[day],
      opens: row.open,
      closes: row.close,
    }));
}
