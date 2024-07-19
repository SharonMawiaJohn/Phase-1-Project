document.addEventListener('DOMContentLoaded', () => {
    const tasksContainer = document.getElementById('tasks');
    const taskForm = document.getElementById('taskForm');
    const submitButton = taskForm.querySelector('button[type="submit"]');
    
    let editingTaskId = null;

    const fetchTasks = () => {
        fetch('http://localhost:3000/tasks')
            .then(response => response.json())
            .then(data => {
                displayTasks(data);
                localStorage.setItem('tasks', JSON.stringify(data));
            })
            .catch(error => console.error('Error fetching tasks:', error));
    };

    const displayTasks = (tasks) => {
        tasksContainer.innerHTML = '';
        const filteredTasks = filterTasks(tasks); 
        const sortedTasks = sortTasks(filteredTasks);

        sortedTasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'project';
            taskDiv.innerHTML = `
                <div class="button-container">
                    <button class="edit" onclick="editTask('${task.id}')">Edit</button>
                    <button class="delete" onclick="deleteTask('${task.id}')">Delete</button>
                </div>
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <p>Status: ${task.status}</p>
                <div class="progress-container">
                    ${createProgressBars(task.status)}
                </div>
                <p>Priority: ${task.priority}</p>
                <p>Due Date: ${task.dueDate}</p>
            `;
            tasksContainer.appendChild(taskDiv);
        });
    };

    const createProgressBars = (status) => {
        const stages = [
            "Task Added",
            "Requirement Analysis",
            "Test Planning",
            "Test Case Development",
            "Test Environment Setup",
            "Test Execution",
            "Completed"
        ];
        
        const index = stages.indexOf(status);
        return stages.map((stage, i) => `
            <div class="progress-bar ${i <= index ? 'progress-filled' : ''}"></div>
        `).join('');
    };

    const filterTasks = (tasks) => {
        if (filterPriority.value === "All") {
            return tasks;
        }
        return tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const twoWeeksFromNow = new Date(today);
            twoWeeksFromNow.setDate(today.getDate() + 14);
            const thirtyDaysFromNow = new Date(today);
            thirtyDaysFromNow.setDate(today.getDate() + 30);

            if (filterPriority.value === "High" && dueDate <= twoWeeksFromNow) return true;
            if (filterPriority.value === "Medium" && dueDate > twoWeeksFromNow && dueDate <= thirtyDaysFromNow) return true;
            if (filterPriority.value === "Low" && dueDate > thirtyDaysFromNow) return true;
            return false;
        });
    };

    const sortTasks = (tasks) => {
        return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    };

    const handleTaskSubmission = (event) => {
        event.preventDefault(); 

        const newTask = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            status: document.getElementById('taskStatus').value,
            dueDate: document.getElementById('taskDueDate').value,
        };

        const today = new Date();
        const dueDate = new Date(newTask.dueDate);
        if (dueDate <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)) {
            newTask.priority = 'High';
        } else if (dueDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
            newTask.priority = 'Medium';
        } else {
            newTask.priority = 'Low';
        }

        if (editingTaskId) {
            fetch(`http://localhost:3000/tasks/${editingTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTask)
            })
            .then(() => {
                fetchTasks();
                resetForm();
            })
            .catch(error => console.error('Error updating task:', error));
        } else {
            fetch('http://localhost:3000/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTask)
            })
            .then(() => {
                fetchTasks();
                taskForm.reset();
            })
            .catch(error => console.error('Error adding task:', error));
        }
    };

    const resetForm = () => {
        taskForm.reset();
        editingTaskId = null;
        submitButton.textContent = "Add Task";
    };

    taskForm.addEventListener('submit', handleTaskSubmission);

    filterPriority.addEventListener('change', () => {
        fetchTasks(); 
    });

    window.deleteTask = (id) => {
        fetch(`http://localhost:3000/tasks/${id}`, {
            method: 'DELETE'
        })
        .then(() => fetchTasks()) 
        .catch(error => console.error('Error deleting task:', error));
    };

    window.editTask = (id) => {
        fetch(`http://localhost:3000/tasks/${id}`)
            .then(response => response.json())
            .then(task => {
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description;
                document.getElementById('taskStatus').value = task.status;
                document.getElementById('taskDueDate').value = task.dueDate;

                editingTaskId = id;
                submitButton.textContent = "Done";
            })
            .catch(error => console.error('Error fetching task for editing:', error));
    };

    const loadTasksFromLocalStorage = () => {
        const savedTasks = JSON.parse(localStorage.getItem('tasks'));
        if (savedTasks) {
            displayTasks(savedTasks);
        } else {
            fetchTasks();
        }
    };

    loadTasksFromLocalStorage();
});
