module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        psy: {
          bg: "#161B22",
          card: "#21262D",
          primary: "#E58A44",
          secondary: "#52796F",
          text: "#F0F4F8",
          subtext: "#8B949E",
          border: "#30363D",
        },
        hpa: {
          am_bg: "#2C2A28",
          am_card: "#3B3632",
          am_primary: "#F4B371",
          am_secondary: "#8CAEA5",
          am_text: "#F9F6F0",
          am_subtext: "#A39E99",
          pm_bg: "#0B0E14",
          pm_card: "#131822",
          pm_primary: "#B27242",
          pm_secondary: "#496875",
          pm_text: "#E2E8F0",
          pm_subtext: "#758498",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        body: ["Outfit", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 8px 32px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
