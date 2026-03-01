module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ai: "#4A90E2",
        human: "#7ED321",
        neutralText: "#333333",
        neutralBg: "#F5F5F5",
        neutralBorder: "#E0E0E0",
        statusPending: "#FFB74D",
        statusResolved: "#4CAF50",
        statusDisputed: "#F44336"
      },
      boxShadow: {
        subtle: "0 2px 4px rgba(0,0,0,0.1)"
      }
    }
  },
  plugins: []
};
