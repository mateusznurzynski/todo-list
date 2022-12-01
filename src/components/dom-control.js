import PubSub from 'pubsub-js';
import Todo from './todos';

export default function DomControl() {
	const todoFormElement = document.querySelector('.todo-form');
	const todosElement = document.querySelector('.todos');

	const initListeners = function () {
		todoFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const data = new FormData(todoFormElement);
			console.log(data.get('todo-name'));
		});
	};

	return {
		initListeners,
	};
}
