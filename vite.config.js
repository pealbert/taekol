import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		{
			name: 'flatten-html-output',
			enforce: 'post',
			generateBundle(_, bundle) {
				for (const [fileName, file] of Object.entries(bundle)) {
					if (fileName.startsWith('pages/') && fileName.endsWith('.html')) {
						file.fileName = fileName.replace('pages/', '');
					}
				}
			},
		},
	],
	build: {
		rollupOptions: {
			input: {
				main: resolve(import.meta.dirname, 'index.html'),
				registration: resolve(import.meta.dirname, 'pages/registration.html'),
				privacy: resolve(import.meta.dirname, 'pages/privacy.html'),
				credits: resolve(import.meta.dirname, 'pages/credits.html'),
			},
		},
	},
});