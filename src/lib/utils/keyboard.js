const shortcuts = new Map();

export function registerShortcut(key, callback, options = {}) {
  const { ctrl = false, shift = false, alt = false, meta = false } = options;
  const id = `${ctrl ? 'ctrl+' : ''}${shift ? 'shift+' : ''}${alt ? 'alt+' : ''}${meta ? 'meta+' : ''}${key.toLowerCase()}`;

  shortcuts.set(id, { callback, options });
  return () => shortcuts.delete(id);
}

export function handleKeydown(event) {
  const id = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.metaKey ? 'meta+' : ''}${event.key.toLowerCase()}`;
  const shortcut = shortcuts.get(id);

  if (!shortcut) return;

  const { callback, options } = shortcut;
  if (!options.allowInInput && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) {
    return;
  }

  event.preventDefault();
  callback(event);
}

export function initKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeydown);
  return () => document.removeEventListener('keydown', handleKeydown);
}
