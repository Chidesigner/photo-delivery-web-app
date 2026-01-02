/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  darkMode: "class", // allow dark/light toggle
  theme: {
    extend: {},
  },
  plugins: [],
};
