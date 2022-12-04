import PubSub from 'pubsub-js';
import { checkNameAvailability, checkStringLength } from '../utils/utilities';

export default (function Project() {
	const projects = [
		{
			name: 'test',
		},
	];

	function loadProjects() {
		PubSub.publish('projectsChanged', projects);
	}

	function createProject(data) {
		if (!validateProjectName(data.get('projectName'))) {
			return false;
		}

		const state = {
			name: data.get('projectName'),
		};

		projects.push(Object.assign({}, state));
		PubSub.publish('projectsChanged', projects);
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

	return { createProject, loadProjects };
})();
