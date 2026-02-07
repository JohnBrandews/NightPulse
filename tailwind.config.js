/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        night: {
          dark: '#0a0a0f',
          darker: '#050508',
          light: '#1a1a24',
          lighter: '#2a2a34',
        },
        neon: {
          pink: '#ff00ff',
          purple: '#9d4edd',
          blue: '#00d4ff',
          cyan: '#00f5ff',
        },
        accent: {
          primary: '#9d4edd',
          secondary: '#ff00ff',
          tertiary: '#00d4ff',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #9d4edd, 0 0 10px #9d4edd' },
          '100%': { boxShadow: '0 0 10px #9d4edd, 0 0 20px #9d4edd, 0 0 30px #9d4edd' },
        },
      },
    },
  },
  plugins: [],
}
