/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this path if your components sit elsewhere
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        void: '#0B0C10',
        surface: '#14161D',
        'surface-elevated': '#1C1F2A',
        border: '#2A2D3A',
        muted: '#8B90A0',
        neon: '#00E676',
        cyan: '#00E5FF',
      },
    },
  },
  plugins: [],
}