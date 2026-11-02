/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    fontFamily: { sans: ['Manrope', 'sans-serif'], display: ['Space Grotesk', 'sans-serif'] },
    colors: { ink: '#0A0A0E', panel: '#15151D', lime: '#D6FC6C', muted: '#A6A6B2' },
    boxShadow: { glow: '0 0 40px rgba(214,252,108,.13)' }
  } },
  plugins: [],
};
