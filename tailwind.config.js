/* eslint-disable */
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			heading: ['Geist Sans', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
  			body: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
  			mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  			sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
  		},
  		transitionTimingFunction: {
  			apple: 'cubic-bezier(.2,.8,.2,1)',
  		},
  		transitionDuration: {
  			'240': '240ms',
  		},
  		backgroundImage: {
  			'blueprint-grid': 'linear-gradient(to right, rgba(230,237,247,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,237,247,0.7) 1px, transparent 1px)',
  		},
  		borderRadius: {
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius-md)',
  			sm: 'var(--radius-sm)',
  			xl: 'var(--radius-xl)',
  		},
  		boxShadow: {
  			subtle: '0 1px 2px rgba(11,58,106,.05)',
  			float: '0 10px 30px -10px rgba(11,58,106,.10)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  		},
  		colors: {
  			// ✅ shadcn/ui semantic tokens (kept at root level with CSS variables)
  			background: 'rgb(var(--color-brand-background) / <alpha-value>)',
  			foreground: 'rgb(var(--color-text-body) / <alpha-value>)',
  			border: 'rgb(var(--color-border) / <alpha-value>)',
  			'border-muted': 'rgb(var(--color-border-muted) / <alpha-value>)',
  			
  			// Brand colors (Design System - CSS variables)
  			brand: {
  				primary: 'rgb(var(--color-brand-primary) / <alpha-value>)',
  				secondary: 'rgb(var(--color-brand-secondary) / <alpha-value>)',
  				highlight: 'rgb(var(--color-brand-highlight) / <alpha-value>)',
  				background: 'rgb(var(--color-brand-background) / <alpha-value>)',
  			},
  			
  			// Text colors
  			text: {
  				body: 'rgb(var(--color-text-body) / <alpha-value>)',
  				muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
  			},
  			
  			// Feedback colors
  			feedback: {
  				success: 'rgb(var(--color-feedback-success) / <alpha-value>)',
  				error: 'rgb(var(--color-feedback-error) / <alpha-value>)',
  			},
  			
  			// shadcn/ui compatibility tokens
  			card: {
  				DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
  				foreground: 'rgb(var(--color-text-body) / <alpha-value>)'
  			},
  			popover: {
  				DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
  				foreground: 'rgb(var(--color-text-body) / <alpha-value>)'
  			},
  			primary: {
  				DEFAULT: 'rgb(var(--color-brand-primary) / <alpha-value>)',
  				foreground: 'rgb(var(--color-base-white) / <alpha-value>)'
  			},
  			secondary: {
  				DEFAULT: 'rgb(var(--color-brand-secondary) / <alpha-value>)',
  				foreground: 'rgb(var(--color-text-body) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'rgb(var(--color-border-muted) / <alpha-value>)',
  				foreground: 'rgb(var(--color-text-muted) / <alpha-value>)'
  			},
  			accent: {
  				DEFAULT: 'rgb(var(--color-brand-highlight) / <alpha-value>)',
  				foreground: 'rgb(var(--color-text-body) / <alpha-value>)'
  			},
  			destructive: {
  				DEFAULT: 'rgb(var(--color-feedback-error) / <alpha-value>)',
  				foreground: 'rgb(var(--color-base-white) / <alpha-value>)'
  			},
  			input: 'rgb(var(--color-border) / <alpha-value>)',
  			ring: 'rgb(var(--color-brand-primary) / <alpha-value>)',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			
  			// ✅ Blueprint Trust tokens (namespaced to avoid collisions)
  			bt: {
  				ink: '#0B1220',
  				background: '#F7FAFF',
  				surface: '#FFFFFF',
  				border: '#E6EDF7',
  				primary: '#0B3A6A',
  				primaryHover: '#082E55',
  				accent: '#2BC4D7',
  				muted: '#475569',
  				success: '#157F3D',
  				warning: '#B45309',
  				danger: '#B42318',
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
