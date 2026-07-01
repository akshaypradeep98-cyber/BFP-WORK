/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      screens: {
        "xs": "400px",
      },
      colors: {
        // Premium Warm Palette
        firm: {
          // Primary Navy
          900: "#2C3A4A",
          800: "#3D4D5C",
          700: "#4E5F6E",
          // Accent Clay
          accent: "#C89B6A",
          // Backgrounds
          cream: "#FAF9F6",
          white: "#FFFFFF",
          // Borders & dividers
          border: "#E8E4DC",
          // Text
          text: "#2C3A4A",
          muted: "#7A8290",
          // Status colors
          sage: "#5B8266",
          terracotta: "#B0654F",
          // Light tints for status pills
          sageBg: "#E1EDE4",
          sageText: "#4A6B54",
          terracottaBg: "#F5EDE0",
          terracottaText: "#8A6A44",
        },
        // Legacy mappings for compatibility
        primary: {
          50: "#F5F3EF",
          100: "#E8E4DC",
          600: "#2C3A4A",
          700: "#1F2937",
          800: "#0D1B2F",
        },
        accent: {
          400: "#C89B6A",
          500: "#C89B6A",
        },
        success: {
          500: "#5B8266",
        },
        error: {
          500: "#B0654F",
        },
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "7": "28px",
        "8": "32px",
      },
      borderRadius: {
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "pill": "20px",
      },
      fontSize: {
        "xs": ["12px", { fontWeight: "400", lineHeight: "1.4" }],
        "sm": ["14px", { fontWeight: "400", lineHeight: "1.5" }],
        "base": ["14px", { fontWeight: "400", lineHeight: "1.5" }],
        "h3": ["15px", { fontWeight: "500", lineHeight: "1.5" }],
        "h2": ["15px", { fontWeight: "500", lineHeight: "1.5" }],
        "h1": ["22px", { fontWeight: "500", lineHeight: "1.3", letterSpacing: "-0.2px" }],
        "stat": ["26px", { fontWeight: "500", lineHeight: "1.2" }],
        "lg": ["18px", { fontWeight: "400", lineHeight: "1.5" }],
        "xl": ["20px", { fontWeight: "400", lineHeight: "1.5" }],
        "2xl": ["24px", { fontWeight: "500", lineHeight: "1.3" }],
        "3xl": ["30px", { fontWeight: "500", lineHeight: "1.2" }],
      },
      boxShadow: {
        "subtle": "0 1px 2px rgba(0,0,0,0.04)",
        "soft": "0 2px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
