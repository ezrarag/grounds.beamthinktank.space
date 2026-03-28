/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        grounds: {
          pine: '#16322b',
          moss: '#3d6c57',
          sage: '#88aa8f',
          sand: '#d7c6a5',
          clay: '#8b5e3b',
          mist: '#edf3ea',
          line: 'rgba(237,243,234,0.14)',
        },
      },
      boxShadow: {
        grounds: '0 28px 90px rgba(8, 17, 13, 0.28)',
      },
      backgroundImage: {
        'grounds-grid':
          'linear-gradient(rgba(237,243,234,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(237,243,234,0.08) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
