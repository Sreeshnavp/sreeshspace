export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function extractDomain(url: string): string {
  try {
    const validUrl = normalizeUrl(url);
    const parsed = new URL(validUrl);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0] || url;
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const domain = extractDomain(url);
    if (!domain) return '';
    return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
  } catch {
    return '';
  }
}

export function generateSuggestedTitle(url: string): string {
  try {
    const domain = extractDomain(url);
    if (!domain) return 'New Link';
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const name = parts[0] === 'www' ? parts[1] : parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return domain;
  } catch {
    return 'New Link';
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(isoString);
  } catch {
    return formatDate(isoString);
  }
}
