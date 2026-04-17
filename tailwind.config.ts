import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  safelist: [
    'from-gray-900','to-gray-700',
    'from-amber-600','to-amber-400',
    'from-orange-700','to-red-500',
    'from-blue-700','to-blue-500',
    'ring-gray-900','ring-amber-500','ring-orange-500','ring-blue-500',
  ],
  theme: { extend: {} },
  plugins: [],
}
export default config
