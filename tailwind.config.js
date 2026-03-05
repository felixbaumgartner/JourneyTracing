/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1e1e2e',
        'sidebar-hover': '#2a2a3e',
        'sidebar-active': '#3a3a5e',
        accent: '#6366f1',
        'accent-light': '#818cf8',
        warn: '#f59e0b',
        'warn-bg': '#fef3c7',
        'warn-border': '#f59e0b',
        'error-bg': '#fee2e2',
        'error-border': '#ef4444',
        'success-bg': '#dcfce7',
        'success-border': '#22c55e',
      },
    },
  },
  plugins: [],
};
