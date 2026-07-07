/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
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
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', 'Segoe UI', 'sans-serif'],
        display: ['"Big Shoulders Display"', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: 'var(--radius)',
        '2xl': 'calc(var(--radius) + 4px)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(8%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up-sm': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in-sm': {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-x-sm': {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'soft-highlight': {
          '0%, 100%': { opacity: '0.38', transform: 'scale(0.88)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        'rail-draw': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'stamp-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '70%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fade-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-up-sm': 'fade-up-sm 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'scale-in-sm': 'scale-in-sm 120ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-x-sm': 'slide-x-sm 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'soft-highlight': 'soft-highlight 1200ms cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'rail-draw': 'rail-draw 420ms cubic-bezier(0.2, 0.8, 0.2, 1) 160ms both',
        'stamp-in': 'stamp-in 320ms cubic-bezier(0.2, 0.8, 0.2, 1) 520ms both',
      },
    },
  },
  plugins: [],
}
