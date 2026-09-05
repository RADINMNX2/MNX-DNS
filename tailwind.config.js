module.exports = {
	content: [
		'./src/**/*.{js,jsx,ts,tsx}',
		'node_modules/daisyui/dist/**/*.js',
		'node_modules/react-daisyui/dist/**/*.js',
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {},
			keyframes: {
				fadeIn: {
					from: {
						opacity: '0',
					},
					to: {
						opacity: '1',
					},
				},
				modalSlideUp: {
					from: {
						opacity: '0',
						transform: 'translateY(25px) scale(0.95)',
					},
					to: {
						opacity: '1',
						transform: 'translateY(0) scale(1)',
					},
				},
			},
			animation: {
				fadeIn: 'fadeIn 0.3s ease-in-out',
				modalSlideUp: 'modalSlideUp 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-flip')],
}