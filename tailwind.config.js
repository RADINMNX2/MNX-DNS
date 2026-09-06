module.exports = {
	content: [
		'./src/**/*.{js,jsx,ts,tsx}',
		'node_modules/daisyui/dist/**/*.js',
		'node_modules/react-daisyui/dist/**/*.js',
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				mnx: {
					obsidian: '#131416',
					surface: '#1c1e21',
					elevated: '#232428',
					border: '#2c2e33',
					primary: '#0C8CE9',
					'primary-light': '#56A8E4',
					neon: '#51FFB5',
					danger: '#f94d40',
					warning: '#FEED8B',
					text: '#ffffff',
					'text-muted': '#bbbbbb',
					'text-dim': '#7a7a7a',
				},
			},
			fontFamily: {
				vazir: ['Vazirmatn', 'Inter', 'sans-serif'],
				inter: ['Inter', 'sans-serif'],
				mono: ['Ubuntu Mono', 'monospace'],
			},
			keyframes: {
				fadeIn: {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				modalSlideUp: {
					from: { opacity: '0', transform: 'translateY(25px) scale(0.95)' },
					to: { opacity: '1', transform: 'translateY(0) scale(1)' },
				},
				glowPulse: {
					'0%, 100%': { boxShadow: '0 0 5px #0C8CE9, 0 0 10px #0C8CE9, 0 0 20px rgba(12, 140, 233, 0.3)' },
					'50%': { boxShadow: '0 0 10px #0C8CE9, 0 0 20px #0C8CE9, 0 0 40px rgba(12, 140, 233, 0.5)' },
				},
				neonBorder: {
					'0%': { borderColor: '#0C8CE9', boxShadow: '0 0 5px #0C8CE9' },
					'50%': { borderColor: '#51FFB5', boxShadow: '0 0 10px #51FFB5' },
					'100%': { borderColor: '#0C8CE9', boxShadow: '0 0 5px #0C8CE9' },
				},
				pingWave: {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'100%': { transform: 'scale(1.5)', opacity: '0' },
				},
				waveform: {
					'0%': { transform: 'scaleY(0.3)' },
					'50%': { transform: 'scaleY(1)' },
					'100%': { transform: 'scaleY(0.3)' },
				},
			},
			animation: {
				fadeIn: 'fadeIn 0.3s ease-in-out',
				modalSlideUp: 'modalSlideUp 0.2s ease-out',
				glowPulse: 'glowPulse 2s infinite',
				neonBorder: 'neonBorder 3s infinite',
				pingWave: 'pingWave 1.5s infinite',
				waveform: 'waveform 1.2s ease-in-out infinite',
			},
		},
	},
	plugins: [require('tailwindcss-flip')],
}