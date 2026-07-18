import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', 'html.dark'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      backgroundColor: {
        dark: {
          primary: '#0d0d0d',
          secondary: '#1a1a1a',
          tertiary: '#2a2a2a',
        },
      },
      textColor: {
        dark: {
          primary: '#ececf1',
          secondary: '#b4b4bc',
          tertiary: '#8e8ea0',
        },
      },
    },
  },
  plugins: [],
};

export default config;
