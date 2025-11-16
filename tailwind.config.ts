import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
        },
        background: 'var(--color-background)',
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          text: 'var(--color-sidebar-text)',
          hover: 'var(--color-sidebar-hover)',
          active: 'var(--color-sidebar-active)',
        },
        code: {
          bg: 'var(--color-code-bg)',
          text: 'var(--color-code-text)',
        },
        border: 'var(--color-border)',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--color-text)',
            '--tw-prose-headings': 'var(--color-text)',
            '--tw-prose-links': 'var(--color-primary)',
            '--tw-prose-bold': 'var(--color-text)',
            '--tw-prose-code': 'var(--color-code-text)',
            '--tw-prose-pre-bg': 'var(--color-code-bg)',
            '--tw-prose-quotes': 'var(--color-text-muted)',
            color: 'var(--color-text)',
            maxWidth: 'none',
            fontSize: '1rem',
            lineHeight: '1.75',
            a: {
              color: 'var(--color-primary)',
              textDecoration: 'none',
              '&:hover': {
                color: 'var(--color-primary-hover)',
              },
            },
            code: {
              color: 'var(--color-code-text)',
              backgroundColor: 'var(--color-code-bg)',
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'var(--color-code-bg)',
              color: 'var(--color-code-text)',
            },
            h1: {
              fontSize: '2rem',
              lineHeight: '1.2',
              fontWeight: '700',
            },
            h2: {
              fontSize: '1.75rem',
              lineHeight: '1.3',
              fontWeight: '600',
            },
            h3: {
              fontSize: '1.5rem',
              lineHeight: '1.4',
              fontWeight: '600',
            },
            h4: {
              fontSize: '1.25rem',
              lineHeight: '1.5',
              fontWeight: '600',
            },
          },
        },
        sm: {
          css: {
            fontSize: '0.875rem',
            lineHeight: '1.7',
            h1: {
              fontSize: '1.75rem',
              lineHeight: '1.2',
            },
            h2: {
              fontSize: '1.5rem',
              lineHeight: '1.3',
            },
            h3: {
              fontSize: '1.25rem',
              lineHeight: '1.4',
            },
            h4: {
              fontSize: '1.125rem',
              lineHeight: '1.5',
            },
          },
        },
        lg: {
          css: {
            fontSize: '1.125rem',
            lineHeight: '1.8',
            h1: {
              fontSize: '2.5rem',
              lineHeight: '1.2',
            },
            h2: {
              fontSize: '2rem',
              lineHeight: '1.3',
            },
            h3: {
              fontSize: '1.75rem',
              lineHeight: '1.4',
            },
            h4: {
              fontSize: '1.5rem',
              lineHeight: '1.5',
            },
          },
        },
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
