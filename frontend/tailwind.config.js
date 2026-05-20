module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // ============================================================
        // Saffron, Sage & Linen — Light Organic Token System
        // ============================================================
        psy: {
          bg: "#FBF9F4",        // Canvas — sun-bleached linen
          card: "#F3EFE6",      // Containers — morning mist
          primary: "#D97736",   // Vedic Saffron — accents, CTAs
          secondary: "#4E7065", // Grounding Sage — success / completion
          text: "#2D3631",      // Deep forest slate — primary text
          subtext: "#7A847F",   // Sage moss — muted labels
          border: "#E8E2D5",    // Ultra-subtle organic border
        },
        // ============================================================
        // HPA Axis Fix — Premium-only adaptive palette (unchanged)
        // ============================================================
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
        display: ["Lora", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // organic, tactile corners — never a 90-degree edge in the UI
        xl: "0.875rem",  // 14
        "2xl": "1rem",   // 16  — inputs + cards
        "3xl": "1.5rem", // 24  — primary action buttons
      },
      boxShadow: {
        // Soft natural elevation — not the heavy dark drop-shadow of the old theme
        card: "0 4px 24px rgba(45, 54, 49, 0.06), 0 1px 2px rgba(45, 54, 49, 0.04)",
        soft: "0 2px 10px rgba(45, 54, 49, 0.04)",
        cta: "0 8px 24px rgba(217, 119, 54, 0.20)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out both",
        "modal-fade": "modalFade 0.25s ease-out both",
        "modal-pop": "modalPop 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        modalFade: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        modalPop: {
          "0%": { opacity: 0, transform: "scale(0.94) translateY(8px)" },
          "100%": { opacity: 1, transform: "scale(1) translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
