/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        niist: {
          navy:  '#1B3A6B',
          blue:  '#2563EB',
          pale:  '#EFF6FF',
        },
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}
