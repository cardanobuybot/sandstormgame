/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Colours of the studio logo: cream, gold and orange of the S and the wordmark,
        // the brown of its shadow, and the warm night behind it.
        sand: {
          50:  '#fff4dc',
          100: '#fbe3b8',
          200: '#fbd58e',
          300: '#f6c46c',
          400: '#f0a64e',
          500: '#e48a3a',
          600: '#9a4a22',
        },
        ink: {
          950: '#0e0905',
          900: '#150e08',
          800: '#1e140b',
          700: '#2a1c10',
          600: '#3a2716',
        },
      },
    },
  },
  plugins: [],
};
