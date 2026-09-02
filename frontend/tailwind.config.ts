import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asphalt: "#050505",
        panel: "#16181C",
        "engine-red": "#E21D25",
        "action-red": "#FF2A2A",
        metallic: "#C5C7CA"
      },
      fontFamily: {
        body: ["Inter", "Manrope", "sans-serif"],
        display: ["Rajdhani", "Inter", "sans-serif"]
      },
      boxShadow: {
        red: "0 0 36px rgba(226, 29, 37, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
