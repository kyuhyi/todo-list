document.addEventListener('DOMContentLoaded', () => {
    // --- THEME ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    };

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- NOTIFICATIONS ---
    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('알림이 허용되었습니다!', { body: '이제 할 일에 대한 알림을 받을 수 있습니다.' });
                }
            });
        }
    };
    
    const showNotification = (taskText) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('할 시간이에요!', {
                body: taskText,
                icon: 'bsd-white.png'
            });
        }
    };

    // --- TODO ---
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoDaySelect = document.getElementById('todo-day');
    const todayList = document.getElementById('today-list');
    const tomorrowList = document.getElementById('tomorrow-list');

    let todos = JSON.parse(localStorage.getItem('todos')) || { today: [], tomorrow: [] };

    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    const renderTodos = () => {
        todayList.innerHTML = '';
        tomorrowList.innerHTML = '';

        todos.today.forEach((todo, index) => renderTodoItem('today', todo, index));
        todos.tomorrow.forEach((todo, index) => renderTodoItem('tomorrow', todo, index));
    };

    const renderTodoItem = (day, todo, index) => {
        const list = day === 'today' ? todayList : tomorrowList;
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';

        const span = document.createElement('span');
        span.textContent = todo.text;
        span.addEventListener('click', () => toggleTodo(day, index));

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'todo-actions';

        const alarmBtn = document.createElement('button');
        alarmBtn.innerHTML = '&#128276;'; // Bell icon
        alarmBtn.title = "알림 설정 (5초 후)";
        alarmBtn.className = 'alarm-btn';
        alarmBtn.addEventListener('click', () => {
            alert(`'${todo.text}'에 대한 알림이 5초 후에 울립니다.`);
            setTimeout(() => showNotification(todo.text), 5000);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&#128465;'; // Trash can icon
        deleteBtn.title = "삭제";
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => deleteTodo(day, index));
        
        span.addEventListener('dblclick', () => {
            editTodo(span, day, index);
        });

        actionsDiv.appendChild(alarmBtn);
        actionsDiv.appendChild(deleteBtn);
        li.appendChild(span);
        li.appendChild(actionsDiv);
        list.appendChild(li);
    };
    
    const editTodo = (spanElement, day, index) => {
        const currentText = todos[day][index].text;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';

        spanElement.replaceWith(input);
        input.focus();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText) {
                todos[day][index].text = newText;
                saveTodos();
            }
            renderTodos();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                renderTodos(); // Cancel edit
            }
        });
    };

    const addTodo = (text, day) => {
        if (text.trim() === '') return;
        todos[day].push({ text, completed: false });
        saveTodos();
        renderTodos();
    };

    const toggleTodo = (day, index) => {
        todos[day][index].completed = !todos[day][index].completed;
        saveTodos();
        renderTodos();
    };

    const deleteTodo = (day, index) => {
        todos[day].splice(index, 1);
        saveTodos();
        renderTodos();
    };

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoInput.value, todoDaySelect.value);
        todoInput.value = '';
    });

    // --- CHAT ---
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');

    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        chatInput.value = '생각 중...';
        chatInput.disabled = true;

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMessage }),
            });

            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            addMessage(data.response, 'bot');

        } catch (error) {
            addMessage('죄송합니다. 오류가 발생했어요. 다시 시도해주세요.', 'bot');
        } finally {
            chatInput.value = '';
            chatInput.disabled = false;
            chatInput.focus();
        }
    });

    // --- INITIAL LOAD ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    renderTodos();
    requestNotificationPermission();
});