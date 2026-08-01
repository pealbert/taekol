import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
			main: resolve(import.meta.dirname, 'index.html'),
			credits: resolve(import.meta.dirname, 'pages/credits.html'),
			registration: resolve(import.meta.dirname, 'pages/registration.html'),
			},
		},
	},
});