export function saveDraft(key, value) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save draft', error);
  }
}

export function loadDraft(key, fallback = null) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load draft', error);
    return fallback;
  }
}

export function clearDraft(key) {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(key);
}
