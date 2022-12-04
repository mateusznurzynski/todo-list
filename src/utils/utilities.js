function createDomElement(type, classesString, innerHTML) {
	const element = document.createElement(type);
	element.className = classesString;
	element.innerHTML = innerHTML;
	return element;
}

function checkNameAvailability(name, array, key) {
	return array.some((object) => object[key] === name);
}

export { createDomElement, checkNameAvailability };
