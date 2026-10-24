import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		devtools({ removeDevtoolsOnBuild: true }),
		tailwindcss({ optimize: true }),
		tanstackRouter({ target: 'react', autoCodeSplitting: true }),
		react(),
	],
})
