import { writable } from 'svelte/store';

function createUIStore() {
  const { subscribe, update } = writable({
    sidebarOpen: true,
    sidebarCollapsed: false,
    activeModal: null,
    modalData: null,
    toasts: [],
    globalLoading: false,
    loadingMessage: '',
    darkMode: false,
    isMobile: false,
    keyboardShortcutsEnabled: true
  });

  return {
    subscribe,

    toggleSidebar() {
      update((state) => ({ ...state, sidebarOpen: !state.sidebarOpen }));
    },

    collapseSidebar() {
      update((state) => ({ ...state, sidebarCollapsed: !state.sidebarCollapsed }));
    },

    openModal(name, data = null) {
      update((state) => ({ ...state, activeModal: name, modalData: data }));
    },

    closeModal() {
      update((state) => ({ ...state, activeModal: null, modalData: null }));
    },

    toast(message, type = 'info', duration = 3000) {
      const id = Date.now();
      const toast = { id, message, type };
      update((state) => ({ ...state, toasts: [...state.toasts, toast] }));

      if (duration > 0) {
        setTimeout(() => {
          update((state) => ({ ...state, toasts: state.toasts.filter((item) => item.id !== id) }));
        }, duration);
      }

      return id;
    },

    dismissToast(id) {
      update((state) => ({ ...state, toasts: state.toasts.filter((item) => item.id !== id) }));
    },

    setLoading(loading, message = '') {
      update((state) => ({ ...state, globalLoading: loading, loadingMessage: message }));
    },

    setDarkMode(dark) {
      update((state) => ({ ...state, darkMode: dark }));
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', dark);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('darkMode', String(dark));
      }
    },

    toggleDarkMode() {
      update((state) => {
        const dark = !state.darkMode;
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', dark);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('darkMode', String(dark));
        }
        return { ...state, darkMode: dark };
      });
    },

    checkMobile() {
      if (typeof window === 'undefined') return;
      update((state) => ({ ...state, isMobile: window.innerWidth < 768 }));
    },

    init() {
      if (typeof window === 'undefined') return;
      const savedDark = localStorage.getItem('darkMode') === 'true';
      this.setDarkMode(savedDark);
      this.checkMobile();
      window.addEventListener('resize', () => this.checkMobile());
    }
  };
}

export const uiStore = createUIStore();
export const { toast, openModal, closeModal, setLoading } = uiStore;
