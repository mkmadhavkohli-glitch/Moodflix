/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          purple: '#7c5cfc',
          pink: '#fc5c9c',
          cyan: '#5cf0fc',
        },
        dark: {
          900: '#050814',
          800: '#0a0f1e',
          700: '#0f1629',
          600: '#161f3a',
          500: '#1e2a4a',
        }
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7c5cfc 0%, #fc5c9c 50%, #5cf0fc 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #7c5cfc, #fc5c9c)',
        'gradient-pink-cyan': 'linear-gradient(135deg, #fc5c9c, #5cf0fc)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #7c5cfc, 0 0 10px #7c5cfc' },
          '100%': { boxShadow: '0 0 20px #fc5c9c, 0 0 40px #fc5c9c' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glow-purple': '0 0 20px rgba(124, 92, 252, 0.5)',
        'glow-pink': '0 0 20px rgba(252, 92, 156, 0.5)',
        'glow-cyan': '0 0 20px rgba(92, 240, 252, 0.5)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
