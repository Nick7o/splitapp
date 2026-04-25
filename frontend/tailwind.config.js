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
        "surface-container-lowest": "rgba(30, 41, 59, 0.72)",
        "surface-container-low": "rgba(30, 41, 59, 0.82)",
        "surface-container": "rgba(51, 65, 85, 0.86)",
        "surface-container-high": "rgba(71, 85, 105, 0.9)",
        "surface-container-highest": "rgba(100, 116, 139, 0.92)",
        "surface-bright": "rgba(71, 85, 105, 0.55)",
        "on-surface": "#F8FAFC",
        "on-surface-variant": "#CBD5E1",
        "primary": "#B45309",
        "on-primary": "#FFFFFF",
        "primary-container": "#92400E",
        "on-primary-container": "#FEF3C7",
        "primary-fixed": "#DBEAFE",
        "secondary": "#F59E0B",
        "on-secondary": "#111827",
        "secondary-container": "rgba(245, 158, 11, 0.18)",
        "on-secondary-container": "#1E293B",
        "tertiary": "#F59E0B",
        "tertiary-container": "#FEF3C7",
        "tertiary-fixed": "#FDE68A",
        "on-tertiary": "#111827",
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
