import PubSub from 'pubsub-js';

export default (function Project() {
	const projects = [];

	function createProject(data) {
		const state = {
			name: data.get('projectName'),
		};

		projects.push(Object.assign({}, state));
		PubSub.publish('projectsChanged', projects);
		console.log(projects);
	}

	return { createProject };
})();
