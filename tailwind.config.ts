import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm Cooperative Palette
        primary: {
          DEFAULT: '#1B4D3E',
          hover: '#153D31',
          light: '#2D6A4F',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#1B4D3E',
          600: '#153D31',
          700: '#145032',
          800: '#0F3D26',
          900: '#0A2E1C',
        },
        accent: {
          DEFAULT: '#C67B4E',
          light: '#D4946A',
          dark: '#A86540',
          50: '#FDF5F0',
          100: '#FBE9DE',
          200: '#F7D3BD',
        },
        // Warm Surfaces
        surface: {
          DEFAULT: '#FDFBF7',
          hover: '#F9F5EF',
        },
        cream: '#F5F0E8',
        border: {
          DEFAULT: '#E5DDD0',
          light: '#F0E8DE',
        },
        // Text
        text: {
          primary: '#2D3B2D',
          secondary: '#5A6B5A',
          muted: '#7A8B7A',
        },
        // Admin Interface (legacy aliases)
        admin: {
          bg: '#F5F0E8',
          surface: '#FDFBF7',
          border: '#E5DDD0',
        },
        // Member Portal
        member: {
          bg: '#F0F9F4',
          accent: '#4ADE80',
          text: '#1B4D3E',
        },
        // Status
        status: {
          deposited: '#16A34A',
          'deposited-bg': '#DCFCE7',
          'not-deposited': '#D97706',
          'not-deposited-bg': '#FEF3C7',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          critical: '#DC2626',
          'critical-bg': '#FEF2F2',
          expired: '#DC2626',
          'expired-bg': '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Display / Hero
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        // Member portal (larger for accessibility)
        'member-heading': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'member-name': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'member-body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        // PIN input
        'pin': '64px',
      },
      boxShadow: {
        'warm': '0 4px 20px rgba(45, 59, 45, 0.08)',
        'warm-lg': '0 8px 32px rgba(45, 59, 45, 0.12)',
        'warm-dropdown': '0 4px 24px rgba(45, 59, 45, 0.15)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
