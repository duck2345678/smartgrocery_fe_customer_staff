const buildFallbackUrl = (name: string): string =>
  `https://dummyimage.com/800x600/22c55e/ffffff&text=${encodeURIComponent(name)}`;

const getApiOrigin = (): string => {
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1').replace(/\/+$/, '');
  // Remove /api/v1 or similar from the end to get the root origin
  return base.replace(/\/api\/v1$/i, '');
};

/**
 * Resolves an image path from the API.
 * Handles absolute URLs, relative paths (with or without leading slash), and fallbacks.
 */
export const resolveImageUrl = (input: unknown, fallbackName: string = 'Image'): string => {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return buildFallbackUrl(fallbackName);
  
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  
  const origin = getApiOrigin();
  if (raw.startsWith('/')) {
    return `${origin}${raw}`;
  }
  return `${origin}/${raw}`;
};
