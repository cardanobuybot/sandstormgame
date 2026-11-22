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
        sand: {
          50:  '#f6efe4',
          100: '#ead9b8',
          200: '#d9bd85',
          300: '#c5a05c',
          400: '#a98145',
          500: '#866534',
        },
        ink: {
          950: '#0a0a0a',
          900: '#121212',
          800: '#1a1a1a',
          700: '#242424',
          600: '#333333',
        },
      },
    },
  },
  plugins: [],
};
