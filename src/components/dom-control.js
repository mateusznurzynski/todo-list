import PubSub from 'pubsub-js';
import Project from './projects';
import { createDomElement } from '../utils/utilities';
import { Modal } from 'bootstrap';
import iconAddProject from '../icons/add-project.svg';
import iconEditProject from '../icons/edit.svg';
import iconExpand from '../icons/expand.svg';

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
			src: iconAddProject,
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
		data.forEach((project) => {
			const projectElement = createDomElement(
				'div',
				'project',
				`<div title='${project.name}' class='project-name'>${project.name}</div>`
			);
			if (!initial) {
				const deleteProjectButton = createDomElement(
					'button',
					'btn-delete-project',
					'X'
				);
				projectElement.appendChild(deleteProjectButton);
				deleteProjectButton.addEventListener('click', (e) => {
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
			`<p class="main-project-name">${project.getName()}:</p>`
		);

		if (!initial) {
			const editIcon = new Image();
			editIcon.src = iconEditProject;

			const projectEditElement = createDomElement(
				'div',
				'project-edit-btn'
			);

			projectEditElement.addEventListener('click', (e) => {
				initProjectEdit(projectName, projectHeaderElement);
			});

			projectEditElement.appendChild(editIcon);
			projectHeaderElement.appendChild(projectEditElement);
		}

		mainElement.appendChild(projectHeaderElement);

		renderTodoForm(project, initial);
		renderTodos(project, initial);
	}

	function renderTodoForm(project, initial) {
		const todoFormElement = createDomElement(
			'form',
			'todo-form todo-container',
			`Name:<input type="text" name="todo-name" id="todo-name" />
			Due date:<input type="date" name="todo-date" id="todo-date" />
			Priority: <select name="todo-priority">
			<option value="0">Low</option>
			<option selected value="1">Normal</option>
			<option value="2">High</option>
			<option value="3">Very High</option>
			</select>
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

	function renderTodos(project, initial) {
		const todos = project.getTodos();
		const todosElement = createDomElement('section', 'todos');
		const todoDefaultElement = createDomElement(
			'article',
			'todo-container todo-element'
		);

		todos.forEach((todo) => {
			const todoId = todos.indexOf(todo);
			const todoElement = todoDefaultElement.cloneNode(true);
			const todoBasicInfoElement = createDomElement(
				'div',
				'todo-basic-info',
				`<div>Name: ${todo.getName()} Due date: ${todo.getDueDate(
					true
				)} Priority: ${todo.getPriority(true)}
				</div>`
			);

			const todoCollapseButton = createDomElement(
				'div',
				'collapse-todo-btn collapsed',
				''
			);
			const expandInfoIcon = new Image();
			expandInfoIcon.src = iconExpand;
			expandInfoIcon.alt = 'Expand Info';
			expandInfoIcon.title = 'Expand Info';
			todoCollapseButton.appendChild(expandInfoIcon);

			todoCollapseButton.setAttribute('data-bs-toggle', 'collapse');
			todoCollapseButton.setAttribute(
				'data-bs-target',
				`#collapseTodo${todoId}`
			);

			const todoCollapseElement = createDomElement(
				'div',
				'collapse todo-details-container',
				`<div class="todo-details"><div class="details-wrapper editable"><div class="todo-detail">Name: ${todo.getName()}</div><div class="todo-detail"> Priority: ${todo.getPriority(
					true
				)}</div><div class="todo-detail"> Due date: ${todo.getDueDate(
					true
				)}</div></div> <div class="details-wrapper uneditable">Creation date: ${todo.getCreationDate()}</div></div>
				<div class="todo-details-controls"><div class="todo-edit-btn">Edit</div> <div class="todo-complete-btn">It's Done!</div></div>`
			);
			todoCollapseElement.id = `collapseTodo${todoId}`;

			const todoDeleteButton = createDomElement(
				'button',
				'delete-todo-btn',
				'X'
			);
			todoDeleteButton.addEventListener('click', (e) => {
				Project.removeTodo(
					e,
					project.getName(),
					todo.getName(),
					initial
				);
			});

			todoBasicInfoElement.appendChild(todoCollapseButton);

			todoElement.appendChild(todoBasicInfoElement);
			todoElement.appendChild(todoCollapseElement);

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

	function initProjectEdit(projectName, headerElement) {
		const editForm = createDomElement('form', 'project-edit-form');
		editForm.addEventListener('submit', (e) => {
			e.preventDefault();
			editInput.blur();
		});

		const editInput = createDomElement('input', 'project-edit-name');
		editInput.setAttribute('name', 'project-edit-name');
		editInput.value = projectName;

		editForm.appendChild(editInput);

		headerElement.innerHTML = '';
		headerElement.appendChild(editForm);
		editInput.focus();

		editInput.addEventListener('blur', (e) => {
			const formData = new FormData(editForm);
			const edited = Project.editProject(projectName, formData);
			if (edited) {
				activeProject.name = formData.get('project-edit-name');
			}
			PubSub.publish('projectsChanged', Project.getProject());
		});
		console.log(editForm);
	}

	return {
		initPage,
	};
})();
