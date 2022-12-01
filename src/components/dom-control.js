import PubSub from 'pubsub-js';
import Todo from './todos';
import { createDomElement } from '../utils/utilities';

export default (function DomControl() {
	const todoFormElement = document.querySelector('.todo-form');
	const todosElement = document.querySelector('.todos');

	function initPage() {
		addListeners();
	}

	function addListeners() {
		todoFormElement.addEventListener('submit', (e) => {
			e.preventDefault();
			const data = new FormData(todoFormElement);
			Todo.addTodo(data);
		});
	}

	PubSub.subscribe('todosChanged', (msg, data) => {
		clearTodos();
		createTodoElements(data);
	});

	function clearTodos() {
		todosElement.innerHTML = '';
	}

	function createTodoElements(data) {
		data.forEach((todo) => {
			const todoElement = createDomElement(
				'div',
				'todo',
				`Name: ${todo.name}`
			);
			todosElement.appendChild(todoElement);
		});
	}

	return {
		initPage,
	};
})();
