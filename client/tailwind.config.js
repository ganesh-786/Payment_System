export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: require('tailwindcss/colors').teal,
        secondary: require('tailwindcss/colors').slate,
        alert: require('tailwindcss/colors').rose,
      },
    },
  },
  plugins: [],
};
