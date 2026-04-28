/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background": "#0B111A",
        "surface": "#121824",
        "surface-container-lowest": "rgba(26, 32, 44, 0.76)",
        "surface-container-low": "rgba(31, 39, 53, 0.86)",
        "surface-container": "rgba(43, 53, 70, 0.9)",
        "surface-container-high": "rgba(57, 69, 90, 0.93)",
        "surface-container-highest": "rgba(82, 96, 122, 0.95)",
        "surface-bright": "rgba(95, 125, 160, 0.46)",
        "on-surface": "#F6FAF8",
        "on-surface-variant": "#B9C7D5",
        "primary": "#12806F",
        "on-primary": "#FFFFFF",
        "primary-container": "#155E54",
        "on-primary-container": "#D6FFF4",
        "primary-fixed": "#9EF2DC",
        "secondary": "#F1B85B",
        "on-secondary": "#1B1306",
        "secondary-container": "rgba(244, 184, 90, 0.16)",
        "on-secondary-container": "#1E293B",
        "tertiary": "#8FB8FF",
        "tertiary-container": "#DBEAFE",
        "tertiary-fixed": "#BFDBFE",
        "on-tertiary": "#07111D",
        "error": "#FB7185",
        "error-container": "rgba(251, 113, 133, 0.16)",
        "outline-variant": "#9AAEC4",
      },
      fontFamily: {
        "headline": ["Playfair Display", "serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      boxShadow: {
        "soft": "0 12px 34px rgba(2, 6, 23, 0.2)",
        "glass": "0 18px 44px rgba(2, 6, 23, 0.18)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
