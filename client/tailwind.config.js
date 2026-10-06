/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          950: '#0a0f1d', // Formal deep midnight slate
          900: '#0f172a', // Slate 900
          850: '#141e33', 
          800: '#1e293b', // Slate 800
          700: '#334155', // Slate 700
          600: '#475569', // Slate 600
          500: '#64748b', // Slate 500
        },
        cyber: {
          cyan: '#38bdf8',    // Formal Executive Blue / Sky
          emerald: '#10b981', // Professional Security Emerald
          amber: '#f59e0b',   // Refined Warm Amber
          red: '#ef4444',     // Formal Crimson
          purple: '#6366f1',  // Institutional Indigo
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 4px 20px -2px rgba(56, 189, 248, 0.15)',
        'glow-emerald': '0 4px 20px -2px rgba(16, 185, 129, 0.15)',
        'glow-amber': '0 4px 20px -2px rgba(245, 158, 11, 0.15)',
        'glow-red': '0 4px 20px -2px rgba(239, 68, 68, 0.20)',
        'glow-subtle': '0 4px 16px -2px rgba(30, 41, 59, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
