import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F8F5",
        surface: "#FFFFFF",
        "surface-subtle": "#F2F3EE",
        foreground: "#171918",
        muted: "#5B615E",
        "muted-stone": "#E8E9E3",
        border: "#E2E4DE",
        "border-subtle": "#EBECE7",
        primary: {
          DEFAULT: "#176B4D",
          hover: "#12533B",
          subtle: "#EAF3EF",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#15803D",
          subtle: "#DCFCE7",
          text: "#14532D",
        },
        warning: {
          DEFAULT: "#B45309",
          subtle: "#FEF3C7",
          text: "#78350F",
        },
        critical: {
          DEFAULT: "#B91C1C",
          subtle: "#FEE2E2",
          text: "#7F1D1D",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Geist", "Satoshi", "Inter", "sans-serif"],
        mono: ["GeistMono", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;

