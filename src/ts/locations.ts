import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const LOCATIONS = [
	{
		elementId: "vorsily",
		coords: [49.5898356, 17.2543139] as [number, number],
		title: "ZŠ sv. Voršily",
	},
	{
		elementId: "roznavska",
		coords: [49.5747689, 17.2529917] as [number, number],
		title: "FZŠ Rožňavská",
	},
	{
		elementId: "sokol",
		coords: [49.5828861, 17.2563136] as [number, number],
		title: "T.J. Sokol",
	},
];

export function initLocationMaps(mapyApiKey: string) {
	LOCATIONS.forEach((loc) => {
		const mapElement = document.getElementById(loc.elementId);
		if (!mapElement) return;

		const map = L.map(loc.elementId, {
			scrollWheelZoom: false,
		}).setView(loc.coords, 15);

		map.attributionControl.setPrefix(false);

		L.tileLayer(
			`https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey=${mapyApiKey}`,
			{
				minZoom: 3,
				maxZoom: 19,
				attribution:
					'<a href="https://www.seznam.cz" target="_blank" rel="noopener noreferrer">&copy; Seznam.cz</a>',
			},
		).addTo(map);

		L.marker(loc.coords).addTo(map).bindPopup(`<b>${loc.title}</b>`);
	});
}
