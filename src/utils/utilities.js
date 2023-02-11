function createDomElement(type, classesString, innerHTML) {
  const element = document.createElement(type || 'div');
  if (classesString) {
    element.className = classesString;
  }
  if (innerHTML) {
    element.innerHTML = innerHTML;
  }

  return element;
}

function checkNameAvailability(name, array, key) {
  if (array.some((object) => object[key] === name)) {
    return false;
  }
  return true;
}

function checkStringLength(string, min, max) {
  if (string.length <= max && string.length >= min) {
    return true;
  }
  return false;
}

export { createDomElement, checkNameAvailability, checkStringLength };
