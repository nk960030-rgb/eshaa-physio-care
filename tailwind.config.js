/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryGreen: '#2f855a',
        secondaryYellow: '#f6e05e',
        dangerRed: '#e53e3e',
        mildGray: '#f7fafc'
      }
    }
  },
  plugins: [],
}