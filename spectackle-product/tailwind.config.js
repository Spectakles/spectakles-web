/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          cream: '#FAF6EF',
          creamCard: '#F4EFE6',
          dark: '#1B1926',
          darkSurface: '#242232',
          green: '#2D8A4E',
          greenLight: '#E8F5EE',
          amber: '#E5A93C',
          yellowCard: '#FDF0D5',
          yellowBadge: '#F4C842',
          peachCard: '#FDECE4',
          mintCard: '#E4F4EC',
          coral: '#E76245',
        }
      },
      boxShadow: {
        'sticker': '2px 3px 0px rgba(0,0,0,0.15)',
        'card': '0 10px 30px -5px rgba(27, 25, 38, 0.05)',
        'float': '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
};
