import PubSub from 'pubsub-js';
import { checkNameAvailability, checkStringLength } from '../utils/utilities';
import { format, parse, parseISO, differenceInDays } from 'date-fns';

export default (function Project() {
	// * * *
	// DEFAULTS
	// * * *

	let projects = [];

	const defaultProject = {
		getName() {
			return this.name;
		},
		getType() {
			return this.type;
		},
		editName(newName) {
			if (this.type === 'filter' || this.type === 'default') {
				return false;
			}
			this.name = newName;
		},
		getTodos(todoName) {
			if (todoName == null) {
				return this.todos;
			}
			const todo = this.todos.find((todo) => todo.getName() === todoName);
			return todo;
		},
		removeTodo(todoName) {
			this.todos = this.todos.filter((todo) => {
				return todo.getName() !== todoName;
			});
			PubSub.publish('todosChanged', this.getName());
		},
		clearTodos() {
			this.todos = [];
		},
		setTodos(newTodosArray) {
			if (Array.isArray(newTodosArray)) {
				this.todos = newTodosArray;
			}
		},
	};

	const defaultFilterProject = {
		getFilter(asString) {
			if (asString) {
				return `${this.filter} days`;
			}
			return this.filter;
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
		getDueDate(asString) {
			if (asString) {
				return this.dueDate
					? format(this.dueDate, 'dd-MM-yyyy')
					: 'Not Specified';
			} else {
				return this.dueDate;
			}
		},
		getCreationDate() {
			return this.creationDate;
		},
		getDescription(checkIfExists) {
			if (checkIfExists) {
				return this.description ? this.description : 'No description';
			} else {
				return this.description;
			}
		},
		getCompleted() {
			return this.completed;
		},
		toggleCompleted() {
			this.completed = !this.completed;
		},
		editName(newName) {
			this.name = newName;
		},
		editPriority(newPriority) {
			this.priority = +newPriority;
		},
		editDueDate(newDueDate) {
			const parsedDate = newDueDate ? parseISO(newDueDate) : null;
			this.dueDate = parsedDate ? parsedDate : null;
		},
		parseDueDate() {
			if (this.dueDate != null) {
				this.dueDate = parseISO(this.dueDate);
			}
		},
	};

	let INITIAL_PROJECTS = [
		Object.assign({}, defaultProject, {
			name: 'Unsorted todos',
			todos: [],
			type: 'default',
		}),
		Object.assign({}, defaultProject, defaultFilterProject, {
			name: `Due in 7 days`,
			filter: 7,
			todos: [],
			type: 'filter',
		}),
	];

	// * * *
	// PROJECTS
	// * * *

	function loadProjects() {
		loadLocalStorage();
		PubSub.publish('projectsChanged', projects);
		PubSub.subscribe('dataChanged', (msg, data) => {
			const defaultInitialProjects = INITIAL_PROJECTS.filter(
				(project) => project.getType() === 'default'
			);

			const projectsString = JSON.stringify(projects);
			const initialProjectsString = JSON.stringify(
				defaultInitialProjects
			);
			localStorage.setItem('projects', projectsString);
			localStorage.setItem('initialProjects', initialProjectsString);
		});
	}

	function loadLocalStorage() {
		const storedProjects = JSON.parse(localStorage.getItem('projects'));
		const storedInitialProjects = JSON.parse(
			localStorage.getItem('initialProjects')
		);

		if (storedProjects != null) {
			projects = [];
			storedProjects.forEach((project) => {
				Object.assign(project, defaultProject);
				const todos = project.getTodos();
				todos.forEach((todo) => {
					Object.assign(todo, defaultTodo);
					todo.parseDueDate();
				});
				projects.push(project);
			});
		}

		if (storedInitialProjects != null) {
			storedInitialProjects.forEach((project) => {
				Object.assign(project, defaultProject);
				project.todos.forEach((todo) => {
					Object.assign(todo, defaultTodo);
					todo.parseDueDate();
				});
				const localProject = INITIAL_PROJECTS.find(
					(element) => element.getName() === project.getName()
				);
				if (localProject) {
					localProject.setTodos(project.todos);
				}
			});
		}
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
		PubSub.publish('dataChanged');

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
			PubSub.publish('dataChanged');
			return true;
		}
	}

	function deleteProject(e) {
		const deletedProjectName = e.target.previousElementSibling.title;
		projects = projects.filter(
			(project) => project.name !== deletedProjectName
		);
		PubSub.publish('projectsChanged', projects);
		PubSub.publish('dataChanged');
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
			creationDate: format(new Date(), 'dd-MM-yyyy, HH:mm'),
			dueDate: parsedDate ? parsedDate : null,
			priority: +data.get('todo-priority') || 1,
			description: data.get('todo-desc') ? data.get('todo-desc') : '',
			completed: false,
		};

		todosArray.push(Object.assign({}, defaultTodo, state));
		PubSub.publish('todosChanged', projectName);
		PubSub.publish('dataChanged');

		return true;
	}

	function validateTodoName(name, todosArray) {
		const TODO_MIN_LENGTH = 1;
		const TODO_MAX_LENGTH = 50;
		if (!checkStringLength(name, TODO_MIN_LENGTH, TODO_MAX_LENGTH)) {
			alert(
				`Todo name must be between ${TODO_MIN_LENGTH} to ${TODO_MAX_LENGTH} characters`
			);
			return false;
		}

		if (!checkNameAvailability(name, todosArray, 'name')) {
			alert(`Name "${name}" already taken`);
			return false;
		}
		return true;
	}

	function removeTodo(project, todo) {
		if (todo.origin) {
			const origin = todo.origin;
			project = getProject(origin.projectName, origin.initial);
		}
		project.removeTodo(todo.getName());
		PubSub.publish('dataChanged');
	}

	function completeTodo(projectName, todoName, initial) {
		const project = getProject(projectName, initial);
		const todo = project.getTodos(todoName);
		todo.toggleCompleted();
		PubSub.publish('dataChanged');
	}

	function editTodo(formData, todoObject, projectObject) {
		if (!formData) {
			return false;
		}
		let todo;
		if (todoObject) {
			todo = todoObject;
		} else {
			return false;
		}

		if (formData.get('newTodoName') !== todoObject.getName()) {
			if (
				!validateTodoName(
					formData.get('newTodoName'),
					projectObject.getTodos()
				)
			) {
				return false;
			}
		}

		todo.editName(formData.get('newTodoName'));
		todo.editPriority(formData.get('newTodoPriority'));

		if (formData.get('todoNoDate')) {
			todo.editDueDate('');
		} else if (formData.get('newTodoDueDate')) {
			todo.editDueDate(formData.get('newTodoDueDate'));
		} else {
			todo.editDueDate(formData.get('oldTodoDueDate'));
		}

		PubSub.publish('dataChanged');

		return true;
	}

	function getAllTodos() {
		let projectsTodos = [];
		let initialProjectsTodos = [];

		projects.forEach((project) => {
			const todos = project.getTodos();
			todos.forEach((todo) => {
				refreshTodoOrigin(todo, project);
			});
			projectsTodos = [...projectsTodos, ...todos];
		});
		INITIAL_PROJECTS.forEach((project) => {
			if (project.getType() === 'default') {
				const todos = project.getTodos();
				todos.forEach((todo) => {
					todo.origin = {
						projectName: project.getName(),
						initial: true,
					};
				});
				initialProjectsTodos = [...initialProjectsTodos, ...todos];
			}
		});

		const allTodos = [...projectsTodos, ...initialProjectsTodos];

		return allTodos;
	}

	function refreshTodoOrigin(todoObject, projectObject) {
		todoObject.origin = {
			projectName: projectObject.getName(),
			initial: false,
		};
	}

	function filterTodos(filterProject) {
		filterProject.clearTodos();

		const allTodos = getAllTodos();

		const todayDate = new Date();

		const filteredTodos = allTodos.filter((todo) => {
			if (todo.getCompleted()) {
				return false;
			}
			const dueDate = todo.getDueDate();
			if (!dueDate) {
				return false;
			}
			if (
				differenceInDays(dueDate, todayDate) <=
				filterProject.getFilter()
			) {
				return true;
			}
		});

		filterProject.setTodos(filteredTodos);
	}

	return {
		createProject,
		editProject,
		deleteProject,
		loadProjects,
		getProject,
		createTodo,
		removeTodo,
		completeTodo,
		editTodo,
		filterTodos,
	};
})();
