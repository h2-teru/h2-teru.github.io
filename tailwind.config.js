/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          900: '#05060a',
          800: '#0a0d18',
          700: '#101424',
        },
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff2bd6',
          lime: '#9bff5d',
          amber: '#ffb454',
          red: '#ff4d6d',
        },
        signal: {
          red: '#ff4d6d',
          blue: '#3aa8ff',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"M PLUS 1 Code"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 12px rgba(0, 240, 255, 0.6), 0 0 32px rgba(0, 240, 255, 0.25)',
        'neon-magenta': '0 0 12px rgba(255, 43, 214, 0.6), 0 0 32px rgba(255, 43, 214, 0.25)',
        'neon-red': '0 0 12px rgba(255, 77, 109, 0.7), 0 0 32px rgba(255, 77, 109, 0.3)',
      },
      animation: {
        flicker: 'flicker 2s infinite',
        scan: 'scan 6s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '45%': { opacity: '0.85' },
          '50%': { opacity: '0.4' },
          '55%': { opacity: '0.95' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
