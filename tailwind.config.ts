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
					DEFAULT: "#0D9488",
					light: "#2DD4BF",
					dark: "#134E4A",
				},
				secondary: {
					DEFAULT: "#2DD4BF",
					foreground: "#134E4A",
				},
				accent: {
					DEFAULT: "#EA580C",
					foreground: "#FFFFFF",
				},
				background: "#F0FDFA",
				foreground: "#134E4A",
			},
			fontFamily: {
				sans: ["var(--font-noto-sans)", "sans-serif"],
				serif: ["var(--font-noto-serif)", "serif"],
			},
			boxShadow: {
				clay: "4px 4px 0px 0px #134E4A",
				"clay-sm": "2px 2px 0px 0px #134E4A",
				"clay-lg": "8px 8px 0px 0px #134E4A",
				"clay-inset": "inset 2px 2px 4px 0px rgba(0, 0, 0, 0.05)",
			},
			borderRadius: {
				clay: "24px",
			},
		},
	},
	plugins: [],
};
export default config;
