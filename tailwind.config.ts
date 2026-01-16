import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary: Google Blue
                primary: {
                    50: "#e8f0fe",
                    100: "#d2e3fc",
                    200: "#aecbfa",
                    300: "#8ab4f8",
                    400: "#669df6",
                    500: "#4285f4",
                    600: "#1a73e8",
                    700: "#1967d2",
                    800: "#185abc",
                    900: "#174ea6",
                    950: "#0d47a1",
                },
                // Secondary: Google Green
                secondary: {
                    50: "#e6f4ea",
                    100: "#ceead6",
                    200: "#a8dab5",
                    300: "#81c995",
                    400: "#5bb974",
                    500: "#34a853",
                    600: "#1e8e3e",
                    700: "#188038",
                    800: "#137333",
                    900: "#0d652d",
                    950: "#064e3b",
                },
                // Accent: Google Yellow/Amber
                accent: {
                    50: "#fef7e0",
                    100: "#feefc3",
                    200: "#fde293",
                    300: "#fdd663",
                    400: "#fcc934",
                    500: "#fbbc04",
                    600: "#f9ab00",
                    700: "#ea8600",
                    800: "#c27200",
                    900: "#945700",
                    950: "#783f00",
                },
                // Danger: Google Red
                danger: {
                    50: "#fce8e6",
                    100: "#fad2cf",
                    200: "#f6aea9",
                    300: "#f28b82",
                    400: "#ee675c",
                    500: "#ea4335",
                    600: "#d93025",
                    700: "#c5221f",
                    800: "#a50e0e",
                    900: "#8c0c0c",
                    950: "#5c0a0a",
                },
                // Neutral: Google Gray
                neutral: {
                    50: "#f8f9fa",
                    100: "#f1f3f4",
                    200: "#e8eaed",
                    300: "#dadce0",
                    400: "#bdc1c6",
                    500: "#9aa0a6",
                    600: "#80868b",
                    700: "#5f6368",
                    800: "#3c4043",
                    900: "#202124",
                    950: "#17181a",
                },
                // Semantic risk levels
                risk: {
                    low: "#34a853",
                    medium: "#fbbc04",
                    high: "#fa7b17",
                    critical: "#ea4335",
                },
                // Estado de planes
                estado: {
                    elaboracion: "#9aa0a6",
                    consulta: "#4285f4",
                    vigente: "#34a853",
                    archivado: "#5f6368",
                },
            },
            fontFamily: {
                sans: ["'Google Sans'", "'Roboto'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "system-ui", "sans-serif"],
                heading: ["'Google Sans'", "'Roboto'", "system-ui", "sans-serif"],
            },
            borderRadius: {
                lg: "0.5rem",
                md: "0.25rem",
                sm: "0.125rem",
            },
            boxShadow: {
                // Material Design elevation shadows
                "elevation-1": "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
                "elevation-2": "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
                "elevation-3": "0 2px 6px 2px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)",
                "elevation-4": "0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px 0 rgba(60,64,67,0.3)",
                card: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
                elevated: "0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)",
                dialog: "0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12)",
            },
            animation: {
                "fade-in": "fadeIn 0.2s ease-out",
                "slide-up": "slideUp 0.3s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
                "scale-in": "scaleIn 0.15s ease-out",
                pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(16px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-16px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                scaleIn: {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
