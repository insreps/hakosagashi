export function normalizeBaseUrl(rawBase?: string): string {
  const trimmed = (rawBase ?? '/').trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  if (trimmed === '.' || trimmed === './') {
    return './';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

function readMetaBaseUrl(): string {
  try {
    const metaEnv = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
    return normalizeBaseUrl(metaEnv?.BASE_URL);
  } catch {
    return '/';
  }
}

export function resolveAssetPath(assetPath: string, baseUrl?: string): string {
  if (
    !assetPath ||
    /^(?:[a-z]+:)?\/\//i.test(assetPath) ||
    assetPath.startsWith('data:') ||
    assetPath.startsWith('mailto:') ||
    assetPath.startsWith('./')
  ) {
    return assetPath;
  }

  const base = normalizeBaseUrl(baseUrl ?? readMetaBaseUrl());
  if (base === './') {
    return assetPath.startsWith('/') ? `.${assetPath}` : `./${assetPath}`;
  }
  if (base === '/') {
    return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  }
  return assetPath.startsWith('/')
    ? `${base}${assetPath.slice(1)}`
    : `${base}${assetPath}`;
}

export function parseHashOrPath(
  hash: string,
  pathname = '/',
  search = ''
): { path: string; search: string; sectionId: string | null } {
  const cleanHash = (hash ?? '').trim();
  if (cleanHash.startsWith('#/')) {
    const withoutHash = cleanHash.slice(1); // "/search?q=..." or "/rooms/id" or "/"
    const qIndex = withoutHash.indexOf('?');
    if (qIndex !== -1) {
      return {
        path: withoutHash.slice(0, qIndex) || '/',
        search: withoutHash.slice(qIndex),
        sectionId: null,
      };
    }
    return {
      path: withoutHash || '/',
      search: '',
      sectionId: null,
    };
  }

  if (
    cleanHash === '#purposes' ||
    cleanHash === '#features' ||
    cleanHash === '#how-to-use'
  ) {
    return {
      path: '/',
      search: '',
      sectionId: cleanHash.slice(1),
    };
  }

  // Fallback for direct path URLs (e.g. local dev /search or /rooms/:id)
  const roomsIdx = pathname.indexOf('/rooms/');
  if (roomsIdx !== -1) {
    return {
      path: pathname.slice(roomsIdx),
      search,
      sectionId: null,
    };
  }
  if (pathname === '/search' || pathname.endsWith('/search')) {
    return {
      path: '/search',
      search,
      sectionId: null,
    };
  }

  return {
    path: '/',
    search: '',
    sectionId: null,
  };
}
