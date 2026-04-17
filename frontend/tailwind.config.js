/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          dark: '#0B0C10',
          darker: '#1F2833',
          light: '#C5C6C7',
          cyan: '#66FCF1',
          teal: '#45A29E',
        }
      }
    },
  },
  plugins: [],
}
