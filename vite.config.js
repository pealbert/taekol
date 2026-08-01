import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		{
			name: "flatten-html-output",
			enforce: "post",
			generateBundle(_, bundle) {
				// Flatten output paths so pages/credits.html -> credits.html in dist/
				for (const [fileName, file] of Object.entries(bundle)) {
					if (fileName.startsWith("pages/") && fileName.endsWith(".html")) {
						const newFileName = fileName.replace("pages/", "");
						file.fileName = newFileName;
						delete bundle[fileName];
						bundle[newFileName] = file;
					}
				}
			},
		},
	],
	build: {
		rollupOptions: {
			input: {
				main: resolve(import.meta.dirname, "index.html"),
				credits: resolve(import.meta.dirname, "pages/credits.html"),
				registration: resolve(import.meta.dirname, "pages/registration.html"),
			},
		},
	},
});
