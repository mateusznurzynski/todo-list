import PubSub from 'pubsub-js';
import Project from './projects';
import { createDomElement } from '../utils/utilities';
import { Modal } from 'bootstrap';
import iconAddProject from '../icons/add-project.svg';
import iconEditProject from '../icons/edit.svg';
import iconExpand from '../icons/expand.svg';
import iconDelete from '../icons/delete.svg';

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
					Project.deleteProject(e);
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
		if (project.getType() === 'filter') {
			return false;
		}

		const todoFormWrapper = createDomElement('div', 'todo-form-wrapper');

		const todoFormButtonElement = createDomElement(
			'div',
			'todo-form-btn',
			'Add new todo'
		);
		todoFormButtonElement.addEventListener('click', (e) => {
			todoFormWrapper.innerHTML = '';
			todoFormWrapper.appendChild(todoFormElement);
		});
		todoFormWrapper.appendChild(todoFormButtonElement);

		const todoFormElement = createDomElement(
			'form',
			'todo-form todo-container',
			`<div class="todo-form-inputs-wrapper"><div class="input-wrapper width-half">
			Name:<input type="text" name="todo-name" id="todo-name" />
			Due date:<input type="date" name="todo-date" id="todo-date" />
			</div>
			<div class="input-wrapper width-half">
			Priority: <select name="todo-priority">
			<option value="0">Low</option>
			<option selected value="1">Normal</option>
			<option value="2">High</option>
			<option value="3">Very High</option>
			</select>
			Description: <textarea name="todo-desc" id="todo-desc"></textarea>
			</div></div>`
		);
		const todoFormCancelElement = createDomElement(
			'div',
			'todo-form-cancel-btn todo-control-btn',
			'Cancel'
		);
		todoFormCancelElement.addEventListener('click', (e) => {
			todoFormWrapper.innerHTML = '';
			todoFormElement.reset();
			todoFormWrapper.appendChild(todoFormButtonElement);
		});

		const todoFormControlWrapper = createDomElement(
			'div',
			'input-wrapper todo-form-control-wrapper',
			`<input
			type="submit"
			name="todo-submit"
			id="todo-submit"
			class="todo-submit-btn todo-control-btn"
			/>`
		);
		todoFormControlWrapper.appendChild(todoFormCancelElement);
		todoFormElement.appendChild(todoFormControlWrapper);

		todoFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const formData = new FormData(e.target);
			Project.createTodo(formData, project.getName(), initial);
		});
		mainElement.appendChild(todoFormWrapper);
	}

	function renderTodos(project, initial) {
		if (project.getType() === 'filter') {
			Project.filterTodos(project);
		}
		const todos = project.getTodos();
		const todosElement = createDomElement('section', 'todos');
		const todoDefaultElement = createDomElement(
			'article',
			'todo-container todo-element'
		);

		todos.forEach((todo) => {
			const todoId = todos.indexOf(todo);
			const todoElement = todoDefaultElement.cloneNode(true);
			if (todo.getCompleted()) {
				todoElement.classList.add('todo-completed');
			}
			const todoBasicInfoElement = createDomElement(
				'div',
				'todo-basic-info',
				`<div class="basic-info-text"></div>`
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
				`<div class="details-text"></div>`
			);
			todoCollapseElement.id = `collapseTodo${todoId}`;

			const todoDeleteButton = createDomElement(
				'div',
				'todo-delete-btn',
				''
			);
			const deleteIcon = new Image();
			deleteIcon.src = iconDelete;
			deleteIcon.alt = 'Remove Todo';
			todoDeleteButton.appendChild(deleteIcon);

			const todoControlsElement = createDomElement(
				'div',
				'todo-details-controls'
			);
			const todoCompleteButton = createDomElement(
				'div',
				'todo-complete-btn',
				''
			);
			todoCompleteButton.addEventListener('click', (e) => {
				Project.completeTodo(
					project.getName(),
					todo.getName(),
					initial
				);
				refreshTodoElementContent(todo, todoElement);
			});
			const todoEditButton = createDomElement(
				'div',
				'todo-edit-btn',
				'Edit'
			);
			todoEditButton.addEventListener('click', (e) => {
				initTodoEdit(todo, project, initial, todoElement);
			});
			todoControlsElement.appendChild(todoEditButton);
			todoControlsElement.appendChild(todoCompleteButton);
			todoCollapseElement.appendChild(todoControlsElement);

			todoDeleteButton.addEventListener('click', (e) => {
				Project.removeTodo(project.getName(), todo.getName(), initial);
			});

			todoBasicInfoElement.appendChild(todoCollapseButton);
			todoBasicInfoElement.insertAdjacentElement(
				'afterbegin',
				todoDeleteButton
			);

			todoElement.appendChild(todoBasicInfoElement);
			todoElement.appendChild(todoCollapseElement);

			todosElement.appendChild(todoElement);

			refreshTodoElementContent(todo, todoElement);
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
	}

	function initTodoEdit(todo, project, initial, todoElement) {
		const todoModalElement = document.querySelector('#editTodoModal');
		const modal = new Modal(todoModalElement);
		const modalHeaderElement =
			todoModalElement.querySelector('.modal-header');
		const modalBodyElement = todoModalElement.querySelector('.modal-body');
		const modalFooterElement =
			todoModalElement.querySelector('.modal-footer');

		modalHeaderElement.innerHTML = `<h1 class="modal-title fs-5" id="editTodoModalLabel">
			Edit ${todo.getName()}:
		</h1>
		<button
			type="button"
			class="btn-close"
			data-bs-dismiss="modal"
			aria-label="Close"
		></button>`;

		modalBodyElement.innerHTML = '';
		const todoFormElement = createDomElement(
			'form',
			'editTodoForm',
			`<div class="edit-todo-inputs">
		<div class="input-wrapper">
			Name:
			<input
				type="text"
				name="newTodoName"
				id="newTodoName"
				value="${todo.getName()}"
			/>
		</div>
		<div class="input-wrapper">
			Priority:
			<select
				name="newTodoPriority"
				id="newTodoPriority"
			>
				<option ${todo.getPriority() === 0 ? 'selected' : ''} value="0">Low</option>
				<option ${todo.getPriority() === 1 ? 'selected' : ''} value="1">Normal</option>
				<option ${todo.getPriority() === 2 ? 'selected' : ''} value="2">High</option>
				<option ${
					todo.getPriority() === 3 ? 'selected' : ''
				} value="3">Very High</option>
			</select>
		</div>
		<div class="input-wrapper">
			<div>Due date: <span class="text-gray">(Currently ${todo.getDueDate(
				true
			)})</span></div>
			<input
				type="date"
				name="newTodoDueDate"
				id="newTodoDueDate"
			/>
			<input
				type="hidden"
				name="oldTodoDueDate"
				id="oldTodoDueDate"
				value="${todo.getDueDate() ? todo.getDueDate() : ''}"
			/>
		</div>
		<div class="input-wrapper checkbox-wrapper">
			Don't specify a due date
			<div class="date-checkbox"></div>
		</div>
		<div class="input-wrapper">
			Description:
			<textarea
				name="newTodoDescription"
				id="newTodoDescription"
				rows="3"
			/>${todo.getDescription(false)}</textarea>
		</div>
	</div>`
		);
		const dateCheckboxElement = createDomElement('input');
		dateCheckboxElement.setAttribute('name', 'todoNoDate');
		dateCheckboxElement.setAttribute('type', 'checkbox');
		if (todo.getDueDate()) {
			dateCheckboxElement.toggleAttribute('checked', true);
		}
		dateCheckboxElement.addEventListener('input', (e) => {
			const dateInput = todoFormElement.querySelector('#newTodoDueDate');
			if (dateCheckboxElement.checked) {
				dateInput.toggleAttribute('disabled', true);
			} else {
				dateInput.removeAttribute('disabled');
			}
		});
		todoFormElement
			.querySelector('.date-checkbox')
			.appendChild(dateCheckboxElement);

		todoFormElement.id = 'editTodoForm';
		todoFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const formData = new FormData(todoFormElement);

			const edited = Project.editTodo(formData, todo, project);
			if (edited) {
				modal.hide();
				refreshTodoElementContent(todo, todoElement);
			}
		});
		modalBodyElement.appendChild(todoFormElement);

		modalFooterElement.innerHTML = `<button
			type="button"
			class="btn btn-secondary"
			data-bs-dismiss="modal"
		>
			Cancel
		</button>
		<button
			type="submit"
			form="editTodoForm"
			class="btn btn-success"
		>
			Save
		</button>`;

		modal.show();
	}

	function refreshTodoElementContent(todo, todoElement) {
		if (todo.getCompleted()) {
			todoElement.classList.add('todo-completed');
		} else {
			todoElement.classList.remove('todo-completed');
		}
		const todoBasicInfo = createDomElement(
			'div',
			'',
			`<div>Name: ${todo.getName()} Due date: ${todo.getDueDate(
				true
			)} Priority: ${todo.getPriority(true)}
			</div>`
		);

		const todoDetailedInfo = createDomElement(
			'div',
			'todo-details',
			`<div class="details-wrapper editable"><div class="todo-detail"> Name: ${todo.getName()}</div><div class="todo-detail"> Priority: ${todo.getPriority(
				true
			)}</div><div class="todo-detail"> Due date: ${todo.getDueDate(
				true
			)}</div></div> 
			<div class="details-wrapper editable"><div class="todo-detail">Description:</div>
			<div class="todo-detail long-string">${todo.getDescription(true)}</div></div>
			<div class="details-wrapper uneditable">Creation date: ${todo.getCreationDate()}</div>`
		);

		const todoCompleteText = `Mark as completed`;

		const todoBasicInfoElement =
			todoElement.querySelector('.basic-info-text');

		const todoDetailsContainerElement =
			todoElement.querySelector('.details-text');

		const todoCompleteButtonElement =
			todoElement.querySelector('.todo-complete-btn');

		todoBasicInfoElement.innerHTML = '';
		todoDetailsContainerElement.innerHTML = '';
		todoCompleteButtonElement.textContent = '';

		todoBasicInfoElement.appendChild(todoBasicInfo);
		todoDetailsContainerElement.appendChild(todoDetailedInfo);
		todoCompleteButtonElement.textContent = `Mark as completed`;
	}

	return {
		initPage,
	};
})();
