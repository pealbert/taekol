const options = document.querySelectorAll(".search__option");
const labelSpan = document.querySelector("#search .search__summary label span");
const searchButton = document.querySelector(
	'#search .search__summary button[type="button"]',
);
const dropdownCheckbox = document.querySelector(
	'#search .search__summary input[type="checkbox"]',
);
const defaultLabel = "Kategorie";
let selectedCategoryId = null;

function resetSearchSelection() {
	selectedCategoryId = null;
	if (labelSpan) labelSpan.textContent = defaultLabel;
	if (dropdownCheckbox) dropdownCheckbox.checked = false;
}

options.forEach((option) => {
	option.addEventListener("click", () => {
		selectedCategoryId = option.dataset.target || null;
		if (labelSpan) {
			labelSpan.textContent = option.textContent;
		}

		const checkbox = document.querySelector(
			'#search .search__summary input[type="checkbox"]',
		);
		if (checkbox) {
			checkbox.checked = false;
		}
	});
});

searchButton?.addEventListener("click", () => {
	if (!selectedCategoryId) return;

	const target = document.getElementById(selectedCategoryId);
	if (!target) return;

	target.scrollIntoView({ behavior: "smooth", block: "start" });
	history.replaceState(null, "", `#${selectedCategoryId}`);

	target.classList.add("search-highlight");
	window.setTimeout(() => {
		target.classList.remove("search-highlight");
	}, 2000);
});

window.addEventListener("scroll", () => {
	if (dropdownCheckbox?.checked || selectedCategoryId) {
		resetSearchSelection();
	}
});
