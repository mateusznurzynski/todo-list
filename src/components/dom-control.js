import PubSub from 'pubsub-js';
import Project from './projects';
import { createDomElement } from '../utils/utilities';
import addProjectIcon from '../icons/add-project.svg';
import { Modal } from 'bootstrap';

export default (function DomControl() {
	const DEFAULT_PROJECT = {
		type: 'initial',
		name: 'Unsorted todos',
	};

	const projectFormElement = document.querySelector('.project-form');

	const projectsElement = document.querySelector('.user-projects');

	const initialProjectsElement = document.querySelector('.initial-projects');

	const projectModalElement = document.querySelector('#addProjectModal');

	const mainElement = document.querySelector('.main');

	const activeProject = {
		type: DEFAULT_PROJECT.type,
		name: DEFAULT_PROJECT.name,
	};
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
			createProjectElements(Project.getProject(null, true), true);
			createProjectElements(data);
			refreshMainElement(data);
		});
		PubSub.subscribe('todosChanged', (msg, projectName) => {
			clearMainElement();
			renderProject(
				projectName,
				activeProject.type === 'initial' ? true : false
			);
		});
		loadImages();
		addListeners();
		Project.loadProjects();
		renderProject(
			activeProject.name,
			activeProject.type === 'initial' ? true : false
		);
	}

	function addListeners() {
		projectFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const data = new FormData(projectFormElement);
			const created = Project.createProject(data);
			if (created) {
				e.target.reset();
				const modal = Modal.getInstance(projectModalElement);
				modal.hide();
			}
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

	function clearProjects() {
		projectsElement.innerHTML = '';
		initialProjectsElement.innerHTML = '';
	}

	function createProjectElements(data, initial) {
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
			if (!initial) {
				const button = deleteProjectButton.cloneNode(true);
				projectElement.appendChild(button);
				button.addEventListener('click', (e) => {
					e.stopPropagation();
					PubSub.publish('deleteProjectClicked', e);
				});
			} else {
				projectElement.toggleAttribute('data-initial', true);
			}

			projectElement.addEventListener('click', (e) => {
				clearMainElement();
				renderProject(project.name, initial);
				activeProject.name = project.name;
				activeProject.type = initial ? 'initial' : 'normal';
			});
			if (initial) {
				initialProjectsElement.appendChild(projectElement);
			} else {
				projectsElement.appendChild(projectElement);
			}
		});
	}

	function renderProject(projectName, initial) {
		console.log('rendered: ', projectName);
		const project = initial
			? Project.getProject(projectName, true)
			: Project.getProject(projectName);

		const projectHeaderElement = createDomElement(
			'h2',
			'main-project-header',
			`${project.getName()}:`
		);
		mainElement.appendChild(projectHeaderElement);

		renderTodoForm(project, initial);
		renderTodos(project);
	}

	function renderTodoForm(project, initial) {
		const todoFormElement = createDomElement(
			'form',
			'todo-form todo-container',
			`<input type="text" name="todo-name" id="todo-name" />
		<input
			type="submit"
			name="todo-submit"
			id="todo-submit"
			class="todo-submit-btn"
		/>`
		);
		todoFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const formData = new FormData(e.target);
			Project.createTodo(formData, project.getName(), initial);
		});
		mainElement.appendChild(todoFormElement);
	}

	function renderTodos(project) {
		const todos = project.getTodos();
		const todosElement = createDomElement('section', 'todos');
		const todoDefaultElement = createDomElement(
			'article',
			'todo-container'
		);

		todos.forEach((todo) => {
			const todoElement = todoDefaultElement.cloneNode(true);
			todoElement.innerText = `Name: ${todo.name}`;
			todosElement.appendChild(todoElement);
		});
		mainElement.appendChild(todosElement);
	}

	function clearMainElement() {
		mainElement.innerHTML = '';
	}

	function refreshMainElement(projects) {
		if (activeProject.type === 'initial') {
			return false;
		}
		clearMainElement();

		const project = projects.find(
			(project) => project.getName() === activeProject.name
		);

		if (project) {
			renderProject(project.getName());
		} else {
			renderProject(
				DEFAULT_PROJECT.name,
				DEFAULT_PROJECT.type === 'initial' ? true : false
			);
		}
	}

	return {
		initPage,
	};
})();
