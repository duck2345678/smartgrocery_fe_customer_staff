module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary))",
          fg: "rgb(var(--color-primary-fg))",
        },
        background: "rgb(var(--color-background))",
        surface: "rgb(var(--color-surface))",
        surface2: "rgb(var(--color-surface-2))",
        border: "rgb(var(--color-border))",
        text: "rgb(var(--color-text))",
        muted: "rgb(var(--color-muted))",
        ring: "rgb(var(--color-ring))",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: {
        outfit: ["Outfit-Regular", "sans-serif"],
        "outfit-bold": ["Outfit-Bold", "sans-serif"],
        inter: ["Inter-Regular", "sans-serif"],
        "inter-medium": ["Inter-Medium", "sans-serif"],
        "inter-bold": ["Inter-Bold", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
