import PubSub from 'pubsub-js';
import todos from './todos';
import Todo from './todos';
import { createDomElement } from '../utils/utilities';

export default (function DomControl() {
	const todoFormElement = document.querySelector('.todo-form');
	const todosElement = document.querySelector('.todos');

	const initListeners = function () {
		todoFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const data = new FormData(todoFormElement);
			Todo.addTodo(data);
		});
	};

	PubSub.subscribe('todosChanged', (msg, data) => {
		clearTodos();
		createTodoElements(data);
	});

	const clearTodos = function () {
		todosElement.innerHTML = '';
	};

	const createTodoElements = function (data) {
		data.forEach((todo) => {
			const todoElement = createDomElement(
				'div',
				'todo',
				`Name: ${todo.name}`
			);
			todosElement.appendChild(todoElement);
		});
	};

	return {
		initListeners,
	};
})();
