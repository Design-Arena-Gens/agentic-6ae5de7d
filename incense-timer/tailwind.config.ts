import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        incense: {
          ash: "#d9cbb7",
          smoke: "#f5efe6",
          ember: "#b87d4b",
          void: "#1e1a17"
        }
      },
      keyframes: {
        "smoke-rise": {
          "0%": { transform: "translateY(0) scaleY(1)", opacity: "0" },
          "10%": { opacity: "0.4" },
          "50%": { opacity: "0.6" },
          "100%": { transform: "translateY(-40px) scaleY(1.2)", opacity: "0" }
        }
      },
      animation: {
        "smoke-rise": "smoke-rise 6s ease-in-out infinite"
      },
      boxShadow: {
        incense: "0 30px 60px -25px rgba(30, 26, 23, 0.6)"
      }
    }
  },
  plugins: []
};

export default config;
