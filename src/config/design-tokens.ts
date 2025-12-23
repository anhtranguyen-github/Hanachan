
/**
 * HanaChan V2 Design Tokens
 * Follows Phase 1 of ui_development_for_code_agent.md
 */

export const DESIGN_TOKENS = {
    colors: {
        primary: {
            main: 'var(--color-sakura-pink)',
            foreground: 'var(--color-sakura-cocoa)',
            hover: 'var(--color-sakura-rose)',
        },
        background: {
            app: 'var(--color-sakura-bg-app)',
            card: 'var(--color-card)',
        },
        text: {
            main: 'var(--color-sakura-ink)',
            muted: 'var(--color-muted-foreground)',
            inverse: '#FFFFFF',
        },
        border: {
            default: 'var(--color-border)',
        },
        semantic: {
            radical: 'var(--color-content-emerald)', // Adjusting to match globals.css or app.config
            kanji: 'var(--color-content-teal)',
            vocabulary: 'var(--color-content-blue)',
            grammar: 'var(--color-content-amber)',
        }
    },
    spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
    },
    typography: {
        fonts: {
            sans: 'var(--font-nunito)',
            display: 'var(--font-fredoka)',
            jp: 'var(--font-m-plus-rounded)',
        },
        sizes: {
            xs: 'var(--font-size-xs)',
            sm: 'var(--font-size-sm)',
            base: 'var(--font-size-base)',
            lg: 'var(--font-size-lg)',
            xl: 'var(--font-size-xl)',
            '2xl': 'var(--font-size-2xl)',
            '3xl': 'var(--font-size-3xl)',
        }
    },
    radius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: '1rem',
        '2xl': '1.5rem',
        clay: '24px',
    }
};
