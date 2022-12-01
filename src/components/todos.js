import PubSub from 'pubsub-js';

export default (function Todo() {
	const todos = [];

	const addTodo = function (data) {
		todos.push({
			name: data.get('todo-name'),
		});
		PubSub.publish('todosChanged', todos);
	};

	return {
		addTodo,
	};
})();
