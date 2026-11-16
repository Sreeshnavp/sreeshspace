/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: 'rgb(var(--page) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        sunken: 'rgb(var(--sunken) / <alpha-value>)',

        // Text tokens
        main: 'rgb(var(--text-main) / <alpha-value>)',
        'text-main': 'rgb(var(--text-main) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        faint: 'rgb(var(--text-faint) / <alpha-value>)',
        'text-faint': 'rgb(var(--text-faint) / <alpha-value>)',

        // Border tokens
        subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
        'border-subtle': 'rgb(var(--border-subtle) / <alpha-value>)',
        strong: 'rgb(var(--border-strong) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        input: 'rgb(var(--border-input) / <alpha-value>)',
        'border-input': 'rgb(var(--border-input) / <alpha-value>)',

        // Accent tokens
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        'accent-text': 'rgb(var(--accent-text) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',

        // Status tokens
        success: 'rgb(var(--success) / <alpha-value>)',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        'success-text': 'rgb(var(--success-text) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        'warning-text': 'rgb(var(--warning-text) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'danger-soft': 'rgb(var(--danger-soft) / <alpha-value>)',
        'danger-text': 'rgb(var(--danger-text) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        'info-soft': 'rgb(var(--info-soft) / <alpha-value>)',
        'info-text': 'rgb(var(--info-text) / <alpha-value>)',

        // Ring token
        ring: 'rgb(var(--ring) / <alpha-value>)',

        // Heatmap levels
        'heatmap-0': 'rgb(var(--heatmap-0) / <alpha-value>)',
        'heatmap-1': 'rgb(var(--heatmap-1) / <alpha-value>)',
        'heatmap-2': 'rgb(var(--heatmap-2) / <alpha-value>)',
        'heatmap-3': 'rgb(var(--heatmap-3) / <alpha-value>)',
        'heatmap-4': 'rgb(var(--heatmap-4) / <alpha-value>)',

        // Category tokens
        'cat-sage-solid': 'rgb(var(--cat-sage-solid) / <alpha-value>)',
        'cat-sage-soft': 'rgb(var(--cat-sage-soft) / <alpha-value>)',
        'cat-sage-text': 'rgb(var(--cat-sage-text) / <alpha-value>)',
        'cat-clay-solid': 'rgb(var(--cat-clay-solid) / <alpha-value>)',
        'cat-clay-soft': 'rgb(var(--cat-clay-soft) / <alpha-value>)',
        'cat-clay-text': 'rgb(var(--cat-clay-text) / <alpha-value>)',
        'cat-lavender-solid': 'rgb(var(--cat-lavender-solid) / <alpha-value>)',
        'cat-lavender-soft': 'rgb(var(--cat-lavender-soft) / <alpha-value>)',
        'cat-lavender-text': 'rgb(var(--cat-lavender-text) / <alpha-value>)',
        'cat-sky-solid': 'rgb(var(--cat-sky-solid) / <alpha-value>)',
        'cat-sky-soft': 'rgb(var(--cat-sky-soft) / <alpha-value>)',
        'cat-sky-text': 'rgb(var(--cat-sky-text) / <alpha-value>)',
        'cat-honey-solid': 'rgb(var(--cat-honey-solid) / <alpha-value>)',
        'cat-honey-soft': 'rgb(var(--cat-honey-soft) / <alpha-value>)',
        'cat-honey-text': 'rgb(var(--cat-honey-text) / <alpha-value>)',
        'cat-rose-solid': 'rgb(var(--cat-rose-solid) / <alpha-value>)',
        'cat-rose-soft': 'rgb(var(--cat-rose-soft) / <alpha-value>)',
        'cat-rose-text': 'rgb(var(--cat-rose-text) / <alpha-value>)',
        'cat-teal-solid': 'rgb(var(--cat-teal-solid) / <alpha-value>)',
        'cat-teal-soft': 'rgb(var(--cat-teal-soft) / <alpha-value>)',
        'cat-teal-text': 'rgb(var(--cat-teal-text) / <alpha-value>)',
        'cat-stone-solid': 'rgb(var(--cat-stone-solid) / <alpha-value>)',
        'cat-stone-soft': 'rgb(var(--cat-stone-soft) / <alpha-value>)',
        'cat-stone-text': 'rgb(var(--cat-stone-text) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(25, 20, 16, 0.04)',
        'soft': '0 2px 8px -1px rgba(25, 20, 16, 0.06), 0 1px 3px -1px rgba(25, 20, 16, 0.04)',
        'soft-hover': '0 8px 24px -4px rgba(25, 20, 16, 0.10), 0 3px 8px -2px rgba(25, 20, 16, 0.04)',
        'raised': '0 10px 30px -5px rgba(25, 20, 16, 0.12), 0 4px 10px -2px rgba(25, 20, 16, 0.06)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
