/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: { accent: '#00FF41' },
        violet: { accent: '#7B2FFF' },
        amber: { accent: '#FFB800' },
        ice: { accent: '#00D4FF' },
        red: { accent: '#FF2D55' },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
