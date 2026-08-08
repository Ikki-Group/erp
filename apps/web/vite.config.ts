import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import path from 'node:path'

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	plugins: [
		devtools({ removeDevtoolsOnBuild: true }),
		tailwindcss({ optimize: true }),
		tanstackRouter({ target: 'react', autoCodeSplitting: true }),
		react(),
	],
})
