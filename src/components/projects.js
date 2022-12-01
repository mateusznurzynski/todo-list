import PubSub from 'pubsub-js';

export default (function Project() {
	const projects = [];

	function createProject(name) {
		projects.push(Object.assign({}, { name }));
		PubSub.publish('projectsChanged', projects);
	}
})();
