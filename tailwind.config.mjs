/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc5fb',
          400: '#36a9f7',
          500: '#0c8ee7',
          600: '#0070c4',
          700: '#015a9f',
          800: '#064c83',
          900: '#0b406d',
          950: '#072849',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
