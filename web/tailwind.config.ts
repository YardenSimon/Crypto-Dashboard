import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* ---- design system dark tokens ---- */
        bg:         '#161015',
        bg2:        '#1B1418',
        surface:    '#211921',
        surface2:   '#2A1F28',
        surface3:   '#33252E',
        line:       '#3B2C36',
        line2:      '#4A3744',
        ink:        '#F0E6E1',
        subt:       '#B4A6AB',
        mute:       '#7E6F76',
        plum:       '#533747',
        plumLift:   '#7C5469',
        mauve:      '#5F506B',
        mauveLift:  '#9685A8',
        slate1:     '#6A6B83',
        slate1Lift: '#9D9FB7',
        slate2:     '#76949F',
        slate2Lift: '#A4BFC8',
        teal:       '#86BBBD',
        tealDeep:   '#3F7274',
        up:         '#7DC9A8',
        down:       '#E08A82',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(0,0,0,0.20), 0 1px 2px 0 rgba(0,0,0,0.30)',
        pop:  '0 16px 40px -10px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(134,187,189,0.25), 0 8px 24px -8px rgba(134,187,189,0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config
