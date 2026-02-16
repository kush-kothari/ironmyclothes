/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.08)',
        'soft-lg': '0 4px 16px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
