import PubSub from 'pubsub-js';
import { checkNameAvailability } from '../utils/utilities';

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
		if (checkNameAvailability(data.get('projectName'), projects, 'name')) {
			console.log('name taken');
		}
		const state = {
			name: data.get('projectName'),
		};

		projects.push(Object.assign({}, state));
		PubSub.publish('projectsChanged', projects);
	}

	return { createProject, loadProjects };
})();
