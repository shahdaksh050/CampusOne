// tailwind.config.js (for Tailwind CSS v3)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Verify these paths match your files
  ],
  theme: {
    extend: {
      // Your custom theme extensions here
    },
  },
  plugins: [
    // Any Tailwind v3 plugins you use (e.g., require('@tailwindcss/forms'))
  ],
};