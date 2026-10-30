/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef0fa',
          100: '#dce0f5',
          200: '#b9c0ea',
          300: '#8a95da',
          400: '#5d6bc8',
          500: '#3a48bb',
          600: '#2630a8',
          700: '#1a1f6e',   /* primary navy */
          800: '#131755',
          900: '#0f1347',
          950: '#080b2e',
        },
        cyan: {
          brand: '#00c8b4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
        modal: '0 20px 60px -12px rgb(0 0 0 / 0.30)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}
