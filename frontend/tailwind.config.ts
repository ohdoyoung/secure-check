import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Pretendard",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 42, 0.05)",
        panel: "0 1px 2px rgba(15, 23, 42, 0.06)"
      },
      colors: {
        clinic: {
          ink: "#101828",
          muted: "#667085",
          line: "#e5e7eb",
          surface: "#f8fafc",
          green: "#18a058",
          amber: "#d97706",
          red: "#dc2626",
          blue: "#2563eb"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
