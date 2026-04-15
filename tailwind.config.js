module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#22C55E",
        background: "#FFFFFF",
        glass: "rgba(255, 255, 255, 0.8)"
      }
    }
  },
  plugins: []
};
