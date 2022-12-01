function createDomElement(type, classesString, innerHTML) {
	const element = document.createElement(type);
	element.className = classesString;
	element.innerHTML = innerHTML;
	return element;
}

export { createDomElement };
