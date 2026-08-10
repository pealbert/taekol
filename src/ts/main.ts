import { initLocationMaps } from "./locations";

const mapyApiKey = import.meta.env.VITE_MAPY_CZ_API_KEY;

document.addEventListener("DOMContentLoaded", () => {
	if (mapyApiKey) {
		initLocationMaps(mapyApiKey);
	} else {
		console.error(
			"Mapy.cz API key is missing in VITE_MAPY_CZ_API_KEY environment variable.",
		);
	}
});
