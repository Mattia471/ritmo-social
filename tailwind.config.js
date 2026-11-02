/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    fontFamily: { sans: ['Manrope', 'sans-serif'], display: ['Space Grotesk', 'sans-serif'] },
    colors: { ink: '#071923', panel: '#0F2933', lime: '#53E6EA', muted: '#A9BDC2', amber: '#FFAD32' },
    boxShadow: { glow: '0 0 40px rgba(83,230,234,.13)' }
  } },
  plugins: [],
};
