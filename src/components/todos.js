import PubSub from 'pubsub-js';

export default (function Todo() {
	const todos = [];

	function addTodo(data) {
		todos.push({
			name: data.get('todo-name'),
		});
		PubSub.publish('todosChanged', todos);
	}

	return {
		addTodo,
	};
})();
