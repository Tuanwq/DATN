const palette = require('./src/theme/palette.json')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/{app,components/native,screens,ui}/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(Object.keys(palette.light).map((name) => [name, `var(--${name})`])),
    },
  },
}
