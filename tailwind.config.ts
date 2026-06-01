import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFFFFF',
          alt: '#FAFAFA',
        },
        surface: {
          light: '#F8F9FC',
          dark: '#0D0D12',
        },
        primary: {
          DEFAULT: '#121317',
          cta: '#121317',
        },
        text: {
          main: '#121317',
          sub: '#5F6368',
          dark: '#FFFFFF',
        },
        brand: {
          pink: '#F5A9B8',
          blue: '#5BCEFA',
        },
      },
      fontSize: {
        'display-large': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '500' }],
        'display-medium': ['45px', { lineHeight: '52px', letterSpacing: '0px', fontWeight: '500' }],
        'headline-large': ['32px', { lineHeight: '40px', letterSpacing: '0px', fontWeight: '500' }],
        'title-large': ['22px', { lineHeight: '28px', letterSpacing: '0px', fontWeight: '500' }],
        'body-large': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
        'label-large': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
      },
      fontFamily: {
        sans: [
          'var(--font-google-sans)',
          'var(--font-harmony-sans)',
          'var(--font-outfit)',
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      borderRadius: {
        'bento': '32px',
        'bento-sm': '24px',
        'giant': '48px',
      },
      boxShadow: {
        'soft-giant': '0 24px 48px -12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
