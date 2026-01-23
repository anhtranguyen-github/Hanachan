import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/features/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: "var(--primary)",
					dark: "var(--primary-dark)",
					glow: "rgba(255, 183, 197, 0.4)",
				},
				secondary: "var(--secondary)",
				background: "var(--background)",
				foreground: "var(--foreground)",
				surface: {
					DEFAULT: "var(--surface)",
					muted: "var(--surface-muted)",
					hover: "#FAF0F2",
				},
				border: "var(--border)",
				radical: "var(--radical)",
				kanji: "var(--kanji)",
				vocab: "var(--vocab)",
				grammar: "var(--grammar)",
				accent: "var(--accent)",
			},
			fontFamily: {
				sans: ["Outfit", "Noto Sans JP", "sans-serif"],
				jp: ["Noto Sans JP", "sans-serif"],
			},
			boxShadow: {
				premium: "0 20px 40px -10px rgba(0, 0, 0, 0.05)",
				glow: "0 0 20px -5px rgba(255, 183, 197, 0.3)",
			},
			borderRadius: {
				'clay': '24px',
				'3xl': '32px',
				'4xl': '40px',
			},
			animation: {
				'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			}
		},
	},
	plugins: [],
};
export default config;
