document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const geminiSuggestBtn = document.getElementById('gemini-suggest-btn');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    const renderTodos = () => {
        todoList.innerHTML = '';
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = todo.completed ? 'completed' : '';
            
            const span = document.createElement('span');
            span.textContent = todo.text;
            span.addEventListener('click', () => toggleTodo(index));

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '삭제';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTodo(index);
            });

            li.appendChild(span);
            li.appendChild(deleteBtn);
            todoList.appendChild(li);
        });
    };

    const addTodo = (text) => {
        if (text.trim() === '') return;
        todos.push({ text, completed: false });
        saveTodos();
        renderTodos();
    };

    const toggleTodo = (index) => {
        todos[index].completed = !todos[index].completed;
        saveTodos();
        renderTodos();
    };

    const deleteTodo = (index) => {
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
    };

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoInput.value);
        todoInput.value = '';
    });

    geminiSuggestBtn.addEventListener('click', async () => {
        geminiSuggestBtn.textContent = '생각 중...';
        geminiSuggestBtn.disabled = true;

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: "일상 생활에서 할 만한 간단한 할 일 한 가지를 추천해줘. 창의적이지만 실용적인 것으로." }),
            });

            if (!response.ok) {
                throw new Error('AI aссистент가 응답하지 않습니다.');
            }

            const data = await response.json();
            // AI 응답에서 할 일 텍스트만 추출 (따옴표, 별표 등 제거)
            const suggestion = data.response.replace(/["*]/g, '').trim();
            todoInput.value = suggestion;
            todoInput.focus();

        } catch (error) {
            console.error('Error fetching suggestion:', error);
            alert(error.message);
        } finally {
            geminiSuggestBtn.textContent = '✨ AI로 할 일 추천받기';
            geminiSuggestBtn.disabled = false;
        }
    });

    renderTodos();
});