export function formatDate(date, mode = 'short') {
  const value = new Date(date);

  switch (mode) {
    case 'short':
      return value.toLocaleDateString('pt-BR');
    case 'long':
      return value.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return value.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'relative':
      return formatRelative(value);
    default:
      return value.toISOString();
  }
}

export function formatRelative(date) {
  const now = Date.now();
  const value = new Date(date).getTime();
  const diffDays = Math.ceil((value - now) / 86400000);

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanha';
  if (diffDays === -1) return 'Ontem';
  if (diffDays > 0 && diffDays < 7) return `Em ${diffDays} dias`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} dias atras`;

  return formatDate(value, 'short');
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}min`;
}

export function formatInterval(days) {
  if (days < 1) return '< 1d';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${(days / 30).toFixed(1)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function isToday(date) {
  return new Date(date).toISOString().split('T')[0] === getToday();
}
