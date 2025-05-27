/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: false, // Disable dark mode
  theme: {
    extend: {
      fontFamily: {
        handwriting: ['Dancing Script', 'cursive'],
      },
    },
  },
  plugins: [],
}
