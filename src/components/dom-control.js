import PubSub from 'pubsub-js';
import Todo from './todos';
import Project from './projects';
import { createDomElement } from '../utils/utilities';
import addProjectIcon from '../icons/add-project.svg';

export default (function DomControl() {
	const todoFormElement = document.querySelector('.todo-form');
	const todosElement = document.querySelector('.todos');

	const projectFormElement = document.querySelector('.project-form');
	const projectsElement = document.querySelector('.user-projects');
	const images = [
		{
			src: addProjectIcon,
			location: document.querySelector('.add-project'),
			alt: 'Add new project',
			className: 'add-project-img',
		},
	];

	function initPage() {
		PubSub.subscribe('projectsChanged', (msg, data) => {
			clearProjects();
			createProjectElements(data);
		});
		loadImages();
		addListeners();
		Project.loadProjects();
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

	function clearProjects() {
		projectsElement.innerHTML = '';
	}

	function createProjectElements(data) {
		const deleteProjectButton = createDomElement(
			'button',
			'btn-delete-project',
			'X'
		);

		data.forEach((project) => {
			const projectElement = createDomElement(
				'div',
				'project',
				`<div title='${project.name}' class='project-name'>${project.name}</div>`
			);
			const button = deleteProjectButton.cloneNode(true);
			projectElement.appendChild(button);
			button.addEventListener('click', (e) => {
				PubSub.publish('deleteProjectClicked', e);
			});
			projectsElement.appendChild(projectElement);
		});
	}

	return {
		initPage,
	};
})();
