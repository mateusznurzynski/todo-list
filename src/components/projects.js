import PubSub from 'pubsub-js';
import { checkNameAvailability, checkStringLength } from '../utils/utilities';

export default (function Project() {
	let projects = [
		{
			name: 'test-project',
			todos: [
				{
					name: 'test-todo',
				},
			],
			getName() {
				return this.name;
			},
			getTodos() {
				return this.todos;
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
	};

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
		if (!validateProjectName(data.get('projectName'))) {
			return false;
		}

		const state = {
			name: data.get('projectName'),
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

	function getProject(projectName) {
		const project = projects.find(
			(project) => project.getName() === projectName
		);
		return project;
	}

	return { createProject, loadProjects, getProject };
})();
