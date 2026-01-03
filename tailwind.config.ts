import type { Config } from 'tailwindcss'
import { THEME } from './src/config/app.config'

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/ui/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/ui/*.{js,ts,jsx,tsx,mdx}',
		'./src/components-parser/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components-markdown/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			fontFamily: {
				sans: [THEME.typography.fonts.sans, 'sans-serif'],
				display: [THEME.typography.fonts.display, 'sans-serif'],
				body: [THEME.typography.fonts.sans, 'sans-serif'],
				jp: [THEME.typography.fonts.jp, 'sans-serif'],
			},
			boxShadow: {
				'none': 'none',
			},
			minWidth: {
				'250': '250px',
				'300': '300px',
				'1000': '1000px'
			},
			colors: {
				// PRIMARY COLORS
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					strong: THEME.palette.brand.sakuraPink,
					leaf: THEME.palette.brand.leafGreen,
					sky: THEME.palette.brand.skyBlue,
				},
				// SECONDARY COLORS
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					yellow: '#F6E7A3',
					lavender: '#C8B6E2',
					coral: '#F2A1A1',
				},
				// NEUTRAL COLORS
				neutral: {
					white: THEME.palette.neutral.white,
					beige: '#EFE6D8',
					gray: THEME.palette.neutral.ink,
					ink: THEME.palette.neutral.ink,
					night: THEME.palette.neutral.night,
				},
				// ACCENT COLORS
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					red: THEME.palette.brand.toriiRed,
					jade: '#2FAE9E',
					shadow: '#B85C7A',
				},
				// BRAND COLORS
				brand: {
					green: THEME.palette.brand.leafGreen,
					peach: THEME.palette.brand.sakuraPink,
					dark: THEME.palette.brand.inkGray,
					blue: '#3b82f6',
				},
				// SHADCN COMPATIBILITY
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				border: 'hsl(var(--border))',
				// LIBRARY CATEGORY COLORS
				vocab: 'var(--color-vocab)',
				kanji: 'var(--color-kanji)',
				grammar: 'var(--color-grammar)',
				radical: 'var(--color-radical)',
				// TOOL PAGE COLORS
				'tool-analyzer': 'var(--color-tool-analyzer)',
				'tool-grammar': 'var(--color-tool-grammar)',
				'tool-hierarchy': 'var(--color-tool-hierarchy)',
				'tool-flashcards': 'var(--color-tool-flashcards)',
				'tool-converter': 'var(--color-tool-converter)',
				'tool-kanji': 'var(--color-tool-kanji)',
			},
			gridTemplateColumns: {
				listItem: '35px 1fr',
				body: '200px 1fr',
				itemsSentences: '399px 1fr',
				blogSideLeft: '48px 1fr 40px',
				blogSideRight: '48px 1fr 120px',
				blogs: '1fr 200px',
				closeBlogs: '1fr 80px'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'clay': '24px',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			transitionTimingFunction: {
				'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
			},
			transitionDuration: {
				'2000': '2000ms',
				'4000': '4000ms',
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [
		// Removed @tailwindcss/typography
		// Removed tailwindcss-animate (was causing build error due to missing dep)
	],
	darkMode: 'class', // or 'media' for system preference
}
export default config
