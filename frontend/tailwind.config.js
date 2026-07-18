/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#12232B",
        navy: "#0E2A3D",
        blue: "#2E6CA4",
        "blue-soft": "#E7F0F7",
        green: "#1E9E6B",
        "green-soft": "#E5F5EE",
        cloud: "#F7FAF7",
        orange: "#FF8A3D",
        yellow: "#FFC94D",
        line: "#E3E9E6",
        muted: "#6B7C79",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
