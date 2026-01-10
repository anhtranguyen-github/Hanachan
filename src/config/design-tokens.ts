

/**
 * Hanachan V2 Design Tokens - boring-deterministic variant
 * Follows Phase 1 of ui_development_for_code_agent.md
 * Constraints: Minimal colors (2-3), system font, flat layout.
 */

export const DESIGN_TOKENS = {
    colors: {
        primary: {
            main: '#000000',
            foreground: '#FFFFFF',
            hover: '#333333',
        },
        background: {
            app: '#FFFFFF',
            card: '#FFFFFF',
            muted: '#F5F5F5',
        },
        text: {
            main: '#000000',
            muted: '#666666',
            inverse: '#FFFFFF',
        },
        border: {
            default: '#DDDDDD',
            active: '#000000',
        },
        status: {
            success: '#000000',
            error: '#FF0000',
            info: '#000000',
        }
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
    },
    typography: {
        fonts: {
            sans: 'system-ui, -apple-system, sans-serif',
            mono: 'ui-monospace, monospace',
        },
        sizes: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
        }
    },
    radius: {
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
    },
    shadows: {
        none: 'none',
    }
};
