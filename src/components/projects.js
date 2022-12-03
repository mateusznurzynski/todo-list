import PubSub from 'pubsub-js';

export default (function Project() {
	const projects = [
		{
			id: 0,
			name: 'test',
		},
	];

	function loadProjects() {
		PubSub.publish('projectsChanged', projects);
	}

	function createProject(data) {
		const state = {
			name: data.get('projectName'),
			id: projects.length,
		};

		projects.push(Object.assign({}, state));
		PubSub.publish('projectsChanged', projects);
		console.log(projects);
	}

	return { createProject, loadProjects };
})();
