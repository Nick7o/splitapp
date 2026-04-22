/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background": "#0B1120",
        "surface": "#111827",
        "surface-container-lowest": "rgba(255, 255, 255, 0.03)",
        "surface-container-low": "rgba(255, 255, 255, 0.05)",
        "surface-container": "rgba(255, 255, 255, 0.08)",
        "surface-container-high": "rgba(255, 255, 255, 0.12)",
        "surface-container-highest": "rgba(255, 255, 255, 0.15)",
        "surface-bright": "rgba(255, 255, 255, 0.04)",
        "on-surface": "#F8FAFC",
        "on-surface-variant": "#94A3B8",
        "primary": "#D97706",
        "on-primary": "#FFFFFF",
        "primary-container": "#B45309",
        "on-primary-container": "#FEF3C7",
        "primary-fixed": "#DBEAFE",
        "secondary": "#F59E0B",
        "on-secondary": "#FFFFFF",
        "secondary-container": "rgba(245, 158, 11, 0.15)",
        "on-secondary-container": "#1E293B",
        "tertiary": "#D97706",
        "tertiary-container": "#FEF3C7",
        "tertiary-fixed": "#FDE68A",
        "on-tertiary": "#FFFFFF",
        "error": "#EF4444",
        "error-container": "#ffdad6",
        "outline-variant": "#CBD5E1",
      },
      fontFamily: {
        "headline": ["Playfair Display", "serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      boxShadow: {
        "soft": "0 8px 32px rgba(15, 23, 42, 0.08)",
        "glass": "0 4px 30px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
