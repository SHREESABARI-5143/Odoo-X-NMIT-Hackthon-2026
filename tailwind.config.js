/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#714B67',
          hover: '#5F3F58',
        },
        secondary: {
          DEFAULT: '#875A7B',
        },
        background: {
          DEFAULT: '#F6F4F5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
        },
        card: {
          DEFAULT: '#F3F2F4',
        },
        border: {
          DEFAULT: '#DEE2E6',
        },
        text: {
          primary: '#212529',
          secondary: '#6C757D',
        },
        status: {
          present: '#28A745',
          halfday: '#FD7E14',
          onleave: '#007BFF',
          absent: '#FFC107',
          approved: '#28A745',
          pending: '#FD7E14',
          rejected: '#DC3545',
          error: '#DC3545',
          success: '#28A745',
          warning: '#FFC107',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
