// Design Tokens - Sistemão
// Centralized design tokens for consistent, professional UI

/**
 * @typedef {Object} ColorScheme
 * @property {string} critical - Red (<40%) - #ef4444
 * @property {string} weak - Orange (40-59%) - #f97316
 * @property {string} medium - Yellow (60-84%) - #eab308
 * @property {string} strong - Green (85%+) - #22c55e
 * @property {string} neutral - Blue - #6366f1
 */

/**
 * @typedef {Object} ColorTokens
 * @property {ColorScheme} mastery - Mastery level colors
 * @property {Object} state - Card state colors
 * @property {Object} rating - FSRS rating colors
 * @property {Object} semantic - Semantic UI colors
 * @property {Object} primary - Primary palette
 */

/**
 * Design tokens - Colors
 * @type {ColorTokens}
 */
export const COLORS = {
  // Mastery level colors (retention-based)
  mastery: {
    critical: '#ef4444', // <40% retention
    weak: '#f97316',      // 40-59% retention
    medium: '#eab308',    // 60-84% retention
    strong: '#22c55e',    // 85%+ retention
    neutral: '#6366f1',   // Undefined/unknown
  },

  // Card state colors
  state: {
    new: '#8b5cf6',
    learning: '#f59e0b',
    review: '#10b981',
    relearning: '#ef4444'
  },

  // FSRS rating colors
  rating: {
    again: '#ef4444',
    hard: '#f97316',
    good: '#22c55e',
    easy: '#3b82f6'
  },

  // Semantic UI colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },

  // Primary palette (Indigo-based)
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  }
};

/**
 * Design tokens - Typography
 * @type {Object}
 */
export const TYPOGRAPHY = {
  // Standard sizes
  xs: 'text-xs',      // 0.75rem (12px)
  sm: 'text-sm',      // 0.875rem (14px)
  base: 'text-base',  // 1rem (16px)
  lg: 'text-lg',      // 1.125rem (18px)
  xl: 'text-xl',      // 1.25rem (20px)
  '2xl': 'text-2xl',  // 1.5rem (24px)
  '3xl': 'text-3xl',  // 1.875rem (30px)

  // Display sizes (for badges, labels, meta info)
  display: {
    xs: 'text-[0.65rem]',  // 10.5px - Badges, chips
    sm: 'text-[0.7rem]',   // 11.2px - Meta info
    md: 'text-[0.75rem]',  // 12px - Section labels
  },

  // Font weights
  weight: {
    normal: 'font-normal',   // 400
    medium: 'font-medium',   // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',       // 700
    extrabold: 'font-extrabold', // 800
  },
};

/**
 * Design tokens - Spacing
 * @type {Object}
 */
export const SPACING = {
  none: 'p-0',
  xs: 'p-2',   // 0.5rem (8px)
  sm: 'p-3',   // 0.75rem (12px)
  md: 'p-4',   // 1rem (16px)
  lg: 'p-6',   // 1.5rem (24px)
  xl: 'p-8',   // 2rem (32px)
  '2xl': 'p-10', // 2.5rem (40px)
};

/**
 * Design tokens - Border radius
 * @type {Object}
 */
export const RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',     // 2px
  base: 'rounded',      // 4px
  md: 'rounded-md',     // 6px
  lg: 'rounded-lg',     // 8px
  xl: 'rounded-xl',     // 12px
  '2xl': 'rounded-2xl',  // 16px
  full: 'rounded-full', // 9999px
};

/**
 * Design tokens - Shadows
 * @type {Object}
 */
export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',           // Small shadow
  base: 'shadow',            // Base shadow
  interactive: 'shadow-interactive', // Hover state
  interactiveHover: 'shadow-interactive-hover', // Active hover
  interactiveActive: 'shadow-interactive-active', // Click state
  lg: 'shadow-lg',           // Large shadow
  xl: 'shadow-xl',           // Extra large
};

/**
 * Design tokens - Transitions
 * @type {Object}
 */
export const TRANSITIONS = {
  base: 'transition-all duration-150 ease-in-out',
  fast: 'transition-all duration-75 ease-out',
  slow: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-150 ease-in-out',
  transform: 'transition-transform duration-150 ease-in-out',
  opacity: 'transition-opacity duration-150 ease-in-out',
};

/**
 * Design tokens - Animation classes
 * @type {Object}
 */
export const ANIMATIONS = {
  none: '',
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse',
  pulseSoft: 'animate-pulse-soft',
  spin: 'animate-spin',
};

/**
 * Design tokens - Z-index layers
 * @type {Object}
 */
export const Z_INDEX = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-60',
  tooltip: 'z-70',
};

/**
 * Design tokens - Breakpoints (for reference)
 * @type {Object}
 */
export const BREAKPOINTS = {
  sm: '640px',   // Small devices (landscape phones, <640px)
  md: '768px',   // Medium devices (tablets, >=768px)
  lg: '1024px',  // Large devices (desktops, >=1024px)
  xl: '1280px',  // Extra large devices, (>=1280px)
  '2xl': '1536px', // Extra extra large devices, (>=1536px)
};

/**
 * Helper: Get mastery color by percentage
 * @param {number} percentage - Retention percentage (0-100)
 * @returns {string} Color hex code
 */
export function getMasteryColor(percentage) {
  if (percentage >= 85) return COLORS.mastery.strong;
  if (percentage >= 60) return COLORS.mastery.medium;
  if (percentage >= 40) return COLORS.mastery.weak;
  return COLORS.mastery.critical;
}

/**
 * Helper: Get mastery level by percentage
 * @param {number} percentage - Retention percentage (0-100)
 * @returns {string} Mastery level name
 */
export function getMasteryLevel(percentage) {
  if (percentage >= 85) return 'strong';
  if (percentage >= 60) return 'medium';
  if (percentage >= 40) return 'weak';
  return 'critical';
}

/**
 * Helper: Get mastery label (Portuguese)
 * @param {number} percentage - Retention percentage (0-100)
 * @returns {string} Label in Portuguese
 */
export function getMasteryLabel(percentage) {
  if (percentage >= 85) return 'forte';
  if (percentage >= 60) return 'médio';
  if (percentage >= 40) return 'fraco';
  return 'crítico';
}

/**
 * Helper: Get mastery background color (alpha blended)
 * @param {number} percentage - Retention percentage (0-100)
 * @returns {string} RGBA color
 */
export function getMasteryBackground(percentage) {
  const color = getMasteryColor(percentage);
  // Convert hex to rgba with 0.1 opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},0.1)`;
}
