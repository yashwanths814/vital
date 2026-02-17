export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        vital: {
          bg: "#ECFAF1",
          text: "#166534",
          primary: "#16A34A",
          dark: "#14532D",
          soft: "#F0FDF4"
        }
      }
    }
  },
  plugins: []
};

