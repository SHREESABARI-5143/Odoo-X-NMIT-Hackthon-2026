/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dayflow: {
          plum: '#714B67',
          'plum-dark': '#52364D',
          'plum-light': '#8A6082',
          orange: '#F6A23A',
          peach: '#FFF1E2',
          blue: '#4F7CAC',
          success: '#3FA66B',
          warning: '#E5A72A',
          danger: '#D85C5C',
          bg: '#F7F7F5',
          card: '#FFFFFF',
          text: '#252525',
          muted: '#6B6B6B',
          border: '#E7E4E1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
