import PubSub from 'pubsub-js';
import { checkNameAvailability, checkStringLength } from '../utils/utilities';
import { format, parse, parseISO } from 'date-fns';

export default (function Project() {
	// * * *
	// DEFAULTS
	// * * *

	let projects = [];

	const defaultProject = {
		getName() {
			return this.name;
		},
		editName(newName) {
			this.name = newName;
		},
		getTodos() {
			return this.todos;
		},
		removeTodo(todoName) {
			this.todos = this.todos.filter((todo) => {
				return todo.getName() !== todoName;
			});
			PubSub.publish('todosChanged', this.getName());
		},
	};

	const defaultTodo = {
		getName() {
			return this.name;
		},
		getPriority(asString) {
			if (asString) {
				switch (this.priority) {
					case 0:
						return 'Low';
					case 1:
						return 'Normal';
					case 2:
						return 'High';
					case 3:
						return 'Very High';
					default:
						return 'Normal';
				}
			} else {
				return this.priority;
			}
		},
	};

	const INITIAL_PROJECTS = [
		Object.assign({}, defaultProject, {
			name: 'Unsorted todos',
			todos: [],
		}),
	];

	// placeholder project
	const placeholderProjectData = new FormData();
	placeholderProjectData.append('project-name', 'test-project');
	const placeholderTodoData = new FormData();
	placeholderTodoData.append('todo-name', 'test-todo');
	createProject(placeholderProjectData);
	createTodo(placeholderTodoData, 'test-project', false);

	// * * *
	// PROJECTS
	// * * *

	function loadProjects() {
		PubSub.publish('projectsChanged', projects);
		PubSub.subscribe('deleteProjectClicked', (msg, e) => {
			const deletedProjectName = e.target.previousElementSibling.title;
			projects = projects.filter(
				(project) => project.name !== deletedProjectName
			);
			PubSub.publish('projectsChanged', projects);
		});
	}

	function createProject(data) {
		if (!validateProjectName(data.get('project-name'))) {
			return false;
		}

		const state = {
			name: data.get('project-name'),
			todos: [],
		};

		projects.push(Object.assign({}, defaultProject, state));
		PubSub.publish('projectsChanged', projects);

		return true;
	}

	function editProject(projectName, data) {
		const newName = data.get('project-edit-name');
		if (projectName === newName) {
			return false;
		}
		if (!validateProjectName(newName)) {
			return false;
		} else {
			getProject(projectName).editName(newName);
			return true;
		}
	}

	function validateProjectName(name) {
		if (!checkStringLength(name, 1, 50)) {
			alert('Project name must be between 1 to 50 characters');
			return false;
		}
		if (!checkNameAvailability(name, projects, 'name')) {
			alert(`Name "${name}" already taken`);
			return false;
		}
		return true;
	}

	function getProject(projectName, initial) {
		const requestedProjects = initial ? INITIAL_PROJECTS : projects;
		if (!projectName) {
			return requestedProjects;
		}
		const project = requestedProjects.find(
			(project) => project.getName() === projectName
		);
		return project;
	}

	// * * *
	// TODOS
	// * * *

	function createTodo(data, projectName, initial) {
		const project = getProject(projectName, initial);
		const todosArray = project.getTodos();

		if (!validateTodoName(data.get('todo-name'), todosArray)) {
			return false;
		}

		const parsedDate = data.get('todo-date')
			? parseISO(data.get('todo-date'))
			: null;

		const state = {
			name: data.get('todo-name'),
			creationDate: format(new Date(), 'dd-MM-yyyy'),
			dueDate: parsedDate ? format(parsedDate, 'dd-MM-yyyy') : null,
			priority: +data.get('todo-priority') || 1,
		};

		todosArray.push(Object.assign({}, defaultTodo, state));
		PubSub.publish('todosChanged', projectName);

		return true;
	}

	function validateTodoName(name, todosArray) {
		console.log(todosArray);
		if (!checkStringLength(name, 1, 50)) {
			alert('Todo name must be between 1 to 50 characters');
			return false;
		}

		if (!checkNameAvailability(name, todosArray, 'name')) {
			alert(`Name "${name}" already taken`);
			return false;
		}
		return true;
	}

	function removeTodo(event, projectName, todoName, initial) {
		const project = getProject(projectName, initial);
		project.removeTodo(todoName);
	}

	return {
		createProject,
		editProject,
		loadProjects,
		getProject,
		createTodo,
		removeTodo,
	};
})();
