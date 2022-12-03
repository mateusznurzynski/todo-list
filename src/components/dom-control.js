import PubSub from 'pubsub-js';
import Todo from './todos';
import Project from './projects';
import { createDomElement } from '../utils/utilities';
import addProjectIcon from '../icons/add-project.svg';

export default (function DomControl() {
	const todoFormElement = document.querySelector('.todo-form');
	const todosElement = document.querySelector('.todos');

	const projectFormElement = document.querySelector('.project-form');
	const images = [
		{
			src: addProjectIcon,
			location: document.querySelector('.add-project'),
			alt: 'Add new project',
			className: 'add-project-img',
		},
	];

	function initPage() {
		loadImages();
		addListeners();
	}

	function addListeners() {
		// todoFormElement.addEventListener('submit', (e) => {
		// 	e.preventDefault();
		// 	const data = new FormData(todoFormElement);
		// 	Todo.addTodo(data);
		// });
		projectFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const data = new FormData(projectFormElement);
			Project.createProject(data);
		});
	}

	function loadImages() {
		images.forEach((image) => {
			const img = new Image();
			img.src = image.src;
			img.alt = image.alt;
			img.classList.add(image.className);
			image.location.appendChild(img);
		});
	}

	PubSub.subscribe('todosChanged', (msg, data) => {
		clearTodos();
		createTodoElements(data);
	});

	function clearTodos() {
		todosElement.innerHTML = '';
	}

	function createTodoElements(data) {
		data.forEach((todo) => {
			const todoElement = createDomElement(
				'div',
				'todo',
				`Name: ${todo.name}`
			);
			todosElement.appendChild(todoElement);
		});
	}

	return {
		initPage,
	};
})();
