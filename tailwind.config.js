module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--color-primary)',
        'background': 'var(--color-background)',
        'text': 'var(--color-text)',
        'subtle-bg': 'var(--color-subtle-bg)',
      },
    },
  },
  plugins: [],
}

