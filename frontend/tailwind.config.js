/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        secondary: '#6c757d',
      },
      // Dark mode color overrides
      backgroundColor: {
        dark: {
          primary: '#1a1a1a',
          secondary: '#2d2d2d',
          tertiary: '#3d3d3d',
        },
      },
      textColor: {
        dark: {
          primary: '#e5e5e5',
          secondary: '#a0a0a0',
        },
      },
    },
  },
  plugins: [],
}
