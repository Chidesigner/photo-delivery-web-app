/** @type {import('postcss').ProcessOptions} */
module.exports = {
  plugins: {
    /**
     * Tailwind CSS v4 PostCSS plugin
     * Handles all utility generation and theme processing
     */
    "@tailwindcss/postcss": {},

    /**
     * Autoprefixer
     * Adds vendor prefixes for cross-browser compatibility
     */
    autoprefixer: {},
  },
};
