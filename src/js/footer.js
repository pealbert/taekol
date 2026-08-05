document.querySelector("footer > span").addEventListener("click", (e) => {
	e.preventDefault();

	window.scrollTo({
		top: 0,
		behavior: "smooth",
	});
});
