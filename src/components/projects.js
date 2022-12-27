import PubSub from 'pubsub-js';
import { checkNameAvailability, checkStringLength } from '../utils/utilities';
import { format, parse, parseISO } from 'date-fns';

export default (function Project() {
	// DEFAULTS

	let projects = [
		{
			name: 'test-project',
			todos: [
				{
					name: 'test-todo',
					getName() {
						return this.name;
					},
				},
			],
			getName() {
				return this.name;
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
		},
	];

	const defaultProject = {
		getName() {
			return this.name;
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
	};

	const INITIAL_PROJECTS = [
		Object.assign({}, defaultProject, {
			name: 'Unsorted todos',
			todos: [],
		}),
	];

	// PROJECTS

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

	// TODOS

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
		loadProjects,
		getProject,
		createTodo,
		removeTodo,
	};
})();
