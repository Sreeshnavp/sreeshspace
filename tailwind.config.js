/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soothing, aesthetic harmonic palette (Relaxing cream, matcha sage, gentle peach, lavender wisteria)
        cream: {
          50: '#fbf9f6',
          100: '#f5f1eb',
          200: '#ede6db',
          300: '#e1d6c6',
          400: '#cebeaa',
          500: '#b8a48d',
        },
        sage: {
          50: '#f2f7f4',
          100: '#e1ede6',
          200: '#c5dcd0',
          300: '#9ec4b1',
          400: '#73a58e',
          500: '#4e876c',
          600: '#3c6e57',
          700: '#315846',
          800: '#284739',
          900: '#223c30',
          950: '#11221a',
        },
        peach: {
          50: '#fff6f2',
          100: '#feeddf',
          200: '#fddbc9',
          300: '#fbbfa8',
          400: '#f69877',
          500: '#ee7751',
          600: '#dc5b34',
          700: '#b74422',
          800: '#94381e',
          900: '#7a311d',
          950: '#42160a',
        },
        coral: {
          50: '#fff5f3',
          100: '#feebe6',
          200: '#fed5cc',
          300: '#fdb5a6',
          400: '#f88873',
          500: '#ee5f45',
          600: '#db442b',
        },
        wisteria: {
          50: '#f8f6fb',
          100: '#efeaf5',
          200: '#ded4eb',
          300: '#c5b3db',
          400: '#a78dc7',
          500: '#8e6eb4',
          600: '#78559e',
          700: '#644485',
        },
        honey: {
          50: '#fffbf2',
          100: '#fef5e1',
          200: '#fde9bf',
          300: '#fcd693',
          400: '#fabd60',
          500: '#f59e0b',
          600: '#d97d06',
        },
        sky: {
          50: '#f2f9fd',
          100: '#e1f2fb',
          200: '#c7e5f8',
          300: '#9fd2f3',
          400: '#70b6eb',
          500: '#4597de',
          600: '#2c79c5',
        },
        espresso: {
          700: '#38322c',
          750: '#2d2722',
          800: '#231e1a',
          850: '#1a1613',
          900: '#14110e',
          950: '#0d0b09',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(25, 20, 16, 0.04)',
        'soft': '0 3px 16px -2px rgba(35, 25, 18, 0.06), 0 1px 3px -1px rgba(35, 25, 18, 0.04)',
        'soft-hover': '0 14px 30px -4px rgba(35, 25, 18, 0.10), 0 4px 12px -2px rgba(35, 25, 18, 0.05)',
        'pill': '0 2px 10px rgba(60, 110, 87, 0.20)',
        'glow': '0 0 28px -2px rgba(78, 135, 108, 0.28)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
