export function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

export function formatPercent(value, decimals = 0) {
  return `${formatNumber(value * 100, decimals)}%`;
}

export function formatCompact(num) {
  if (num < 1000) return `${num}`;
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}k`;
  return `${(num / 1_000_000).toFixed(1)}M`;
}

export function truncate(text, length = 50) {
  if (!text || text.length <= length) return text;
  return `${text.slice(0, length - 3)}...`;
}

export function pluralize(count, singular, plural = null) {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || `${singular}s`}`;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatInterval(interval, isMinutes = false) {
  if (isMinutes) {
    if (interval < 60) return `${interval}m`;
    return `${Math.round(interval / 60)}h`;
  }

  if (interval === 1) return '1d';
  if (interval < 30) return `${interval}d`;
  if (interval < 365) return `${(interval / 30).toFixed(1)}mo`;
  return `${(interval / 365).toFixed(1)}y`;
}
