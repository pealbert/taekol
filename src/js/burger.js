const header = document.querySelector("header");
const burgerButton = document.querySelector(".burger");

if (header && burgerButton) {
	const setMenuState = (isOpen) => {
		burgerButton.classList.toggle("is-active", isOpen);
		header.classList.toggle("header__expanded", isOpen);
		burgerButton.setAttribute("aria-expanded", String(isOpen));
	};

	burgerButton.addEventListener("click", () => {
		const isOpen = !burgerButton.classList.contains("is-active");
		setMenuState(isOpen);
	});

	header.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", () => {
			if (window.innerWidth < 768) {
				setMenuState(false);
			}
		});
	});

	window.addEventListener("resize", () => {
		if (window.innerWidth >= 768) {
			setMenuState(false);
		}
	});
}
