document.addEventListener('DOMContentLoaded', () => {
    const tasksContainer = document.getElementById('tasks'); // Container to display tasks
    const taskForm = document.getElementById('taskForm'); // The form for adding/editing tasks
    const submitButton = taskForm.querySelector('button[type="submit"]'); // The submit button in the form
    
    let editingTaskId = null; // Variable to keep track of the currently editing task ID

    // Function to fetch tasks from the server
    const fetchTasks = () => {
        fetch('http://localhost:3000/tasks') // Make a GET request to fetch tasks
            .then(response => response.json()) // Convert the response to JSON
            .then(data => {
                displayTasks(data); // Display the fetched tasks
                localStorage.setItem('tasks', JSON.stringify(data)); // Store the tasks in local storage
            })
            .catch(error => console.error('Error fetching tasks:', error)); // Log any errors
    };

    // Function to display tasks in the tasks container
    const displayTasks = (tasks) => {
        tasksContainer.innerHTML = ''; // Clear the current tasks in the container
        const filteredTasks = filterTasks(tasks); // Filter tasks based on the selected priority
        const sortedTasks = sortTasks(filteredTasks); // Sort the filtered tasks by due date

        sortedTasks.forEach(task => {
            const taskDiv = document.createElement('div'); // Create a new div for each task
            taskDiv.className = 'project'; // Assign the 'project' class for styling
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
            tasksContainer.appendChild(taskDiv); // Add the task div to the container
        });
    };

    // Function to create progress bars based on task status
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
        
        const index = stages.indexOf(status); // Find the index of the current status in the stages array
        return stages.map((stage, i) => `
            <div class="progress-bar ${i <= index ? 'progress-filled' : ''}"></div>
        `).join(''); // Generate HTML for each progress bar
    };

    // Function to filter tasks based on selected priority
    const filterTasks = (tasks) => {
        if (filterPriority.value === "All") { // If "All" is selected, return all tasks
            return tasks;
        }
        return tasks.filter(task => {
            const dueDate = new Date(task.dueDate); // Convert task's due date to a Date object
            const today = new Date(); // Current date
            const twoWeeksFromNow = new Date(today);
            twoWeeksFromNow.setDate(today.getDate() + 14); // Date 14 days from today
            const thirtyDaysFromNow = new Date(today);
            thirtyDaysFromNow.setDate(today.getDate() + 30); // Date 30 days from today

            // Filter tasks based on priority and due date
            if (filterPriority.value === "High" && dueDate <= twoWeeksFromNow) return true;
            if (filterPriority.value === "Medium" && dueDate > twoWeeksFromNow && dueDate <= thirtyDaysFromNow) return true;
            if (filterPriority.value === "Low" && dueDate > thirtyDaysFromNow) return true;
            return false;
        });
    };

    // Function to sort tasks by due date
    const sortTasks = (tasks) => {
        return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // Sort tasks in ascending order by due date
    };

    // Function to handle form submission for adding or editing tasks
    const handleTaskSubmission = (event) => {
        event.preventDefault(); // Prevent the default form submission

        const newTask = {
            title: document.getElementById('taskTitle').value, // Get the title from the form
            description: document.getElementById('taskDescription').value, // Get the description from the form
            status: document.getElementById('taskStatus').value, // Get the selected status from the form
            dueDate: document.getElementById('taskDueDate').value, // Get the due date from the form
        };

        // Determine the priority based on the due date
        const today = new Date();
        const dueDate = new Date(newTask.dueDate);
        if (dueDate <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)) {
            newTask.priority = 'High'; // Set priority to High if due within 14 days
        } else if (dueDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
            newTask.priority = 'Medium'; // Set priority to Medium if due within 30 days
        } else {
            newTask.priority = 'Low'; // Set priority to Low if due after 30 days
        }

        // Check if editing an existing task
        if (editingTaskId) {
            // If editing, make a PUT request to update the task
            fetch(`http://localhost:3000/tasks/${editingTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json' // Set content type to JSON
                },
                body: JSON.stringify(newTask) // Send the updated task data
            })
            .then(() => {
                fetchTasks(); // Fetch updated tasks
                resetForm(); // Reset the form
            })
            .catch(error => console.error('Error updating task:', error)); // Log errors
        } else {
            // If adding a new task, make a POST request
            fetch('http://localhost:3000/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Set content type to JSON
                },
                body: JSON.stringify(newTask) // Send the new task data
            })
            .then(() => {
                fetchTasks(); // Fetch tasks to update the display
                taskForm.reset(); // Reset the form fields
            })
            .catch(error => console.error('Error adding task:', error)); // Log errors
        }
    };

    // Function to reset the form after submission
    const resetForm = () => {
        taskForm.reset(); // Clear form fields
        editingTaskId = null; // Clear editing task ID
        submitButton.textContent = "Add Task"; // Reset button text to "Add Task"
    };

    // Event listener for form submission
    taskForm.addEventListener('submit', handleTaskSubmission);

    // Event listener for filter priority change
    filterPriority.addEventListener('change', () => {
        fetchTasks(); // Fetch tasks when the filter changes
    });

    // Function to delete a task
    window.deleteTask = (id) => {
        fetch(`http://localhost:3000/tasks/${id}`, {
            method: 'DELETE' // Make a DELETE request for the specified task
        })
        .then(() => fetchTasks()) // Fetch updated tasks after deletion
        .catch(error => console.error('Error deleting task:', error)); // Log errors
    };

    // Function to edit a task
    window.editTask = (id) => {
        fetch(`http://localhost:3000/tasks/${id}`) // Fetch the task details
            .then(response => response.json()) // Convert response to JSON
            .then(task => {
                // Populate the form with the task's existing details
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description;
                document.getElementById('taskStatus').value = task.status;
                document.getElementById('taskDueDate').value = task.dueDate;

                editingTaskId = id; // Set the editing task ID
                submitButton.textContent = "Done"; // Change button text to "Done"
            })
            .catch(error => console.error('Error fetching task for editing:', error)); // Log errors
    };

    // Function to load tasks from local storage or fetch from the server
    const loadTasksFromLocalStorage = () => {
        const savedTasks = JSON.parse(localStorage.getItem('tasks')); // Retrieve saved tasks from local storage
        if (savedTasks) {
            displayTasks(savedTasks); // Display saved tasks if available
        } else {
            fetchTasks(); // Otherwise, fetch tasks from the server
        }
    };

    loadTasksFromLocalStorage(); // Initial load of tasks
});
