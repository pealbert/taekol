import Lenis from "lenis";
import "lenis/dist/lenis.css";

const isMobile = window.matchMedia("(max-width: 768px)").matches;

let _lenis = null;

if (!isMobile) {
	_lenis = new Lenis({
		duration: 1.2,
		easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
		orientation: "vertical",
		gestureOrientation: "vertical",
		wheelMultiplier: 1,
		infinite: false,
		autoRaf: true,
	});
}
