document.addEventListener('DOMContentLoaded', () => {
    let tasks = [];
    let categories = ['איסוף חבילה', 'פינוי פסולת ימי חמישי', 'רשימת קניות', 'הבנים שלנו'];
    const users = ['ליאור', 'זיו'];
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const statistics = document.getElementById('statistics');
    const calendar = document.getElementById('calendar');

    // טעינת משימות מ-localStorage
    if (localStorage.getItem('tasks')) {
        try {
            tasks = JSON.parse(localStorage.getItem('tasks'));
        } catch (e) {
            console.error('Error parsing tasks from localStorage', e);
            tasks = [];
        }
    }

    // טעינת קטגוריות מ-localStorage
    if (localStorage.getItem('categories')) {
        try {
            categories = JSON.parse(localStorage.getItem('categories'));
        } catch (e) {
            console.error('Error parsing categories from localStorage', e);
            categories = ['איסוף חבילה', 'פינוי פסולת ימי חמישי', 'רשימת קניות', 'הבנים שלנו'];
        }
    } else {
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    function addCategory() {
        const newCategoryInput = document.getElementById('newCategory');
        const newCategory = newCategoryInput.value.trim();
        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            updateCategoryDropdown();
            newCategoryInput.value = '';
            localStorage.setItem('categories', JSON.stringify(categories));
            alert('קטגוריה חדשה נוספה בהצלחה!');
        } else if (categories.includes(newCategory)) {
            alert('קטגוריה זו כבר קיימת.');
        } else {
            alert('אנא הכנס שם קטגוריה תקין.');
        }
    }

    function updateCategoryDropdown() {
        const categoryDropdown = document.getElementById('taskCategory');
        const filterCategoryDropdown = document.getElementById('filterCategory');
        categoryDropdown.innerHTML = '<option value="">בחר קטגוריה</option>';
        filterCategoryDropdown.innerHTML = '<option value="">כל הקטגוריות</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryDropdown.appendChild(option);

            const filterOption = option.cloneNode(true);
            filterCategoryDropdown.appendChild(filterOption);
        });
    }

    function addTask(e) {
        e.preventDefault();
        const newTask = {
            id: Date.now(),
            title: document.getElementById('taskTitle').value.trim(),
            notes: document.getElementById('taskNotes').value.trim(),
            category: document.getElementById('taskCategory').value,
            creator: document.getElementById('taskCreator').value,
            assignee: document.getElementById('taskAssignee').value,
            urgency: document.getElementById('taskUrgency').value,
            date: document.getElementById('taskDate').value,
            repeat: document.getElementById('taskRepeat').value,
            completed: false
        };

        if (!newTask.title || !newTask.category || !newTask.creator || !newTask.assignee || !newTask.date || !newTask.urgency) {
            alert('אנא מלא את כל השדות הנדרשים.');
            return;
        }

        tasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        renderStatistics();
        renderCalendar();
        taskForm.reset();
        alert('משימה נוספה בהצלחה!');
    }

    function renderTasks() {
        const searchTerm = document.getElementById('taskSearch').value.toLowerCase();
        const filterCategory = document.getElementById('filterCategory').value;
        const filterUrgency = document.getElementById('filterUrgency').value;

        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => !task.completed &&
                         task.title.toLowerCase().includes(searchTerm) &&
                         (filterCategory === '' || task.category === filterCategory) &&
                         (filterUrgency === '' || task.urgency === filterUrgency)
        );

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li>אין משימות תואמות לחיפוש.</li>';
            return;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task ${task.urgency}`;
            li.innerHTML = `
                <div class="task-details">
                    <strong>${sanitizeHTML(task.title)}</strong><br>
                    הערות: ${sanitizeHTML(task.notes)}<br>
                    קטגוריה: ${sanitizeHTML(task.category)}<br>
                    יוצר: ${sanitizeHTML(task.creator)}<br>
                    אחראי: ${sanitizeHTML(task.assignee)}<br>
                    דחיפות: ${getUrgencyText(task.urgency)}<br>
                    תאריך יעד: ${sanitizeHTML(task.date)}<br>
                    חזרה: ${getRepeatText(task.repeat)}
                </div>
                <div class="task-actions">
                    <button data-id="${task.id}" class="complete-task-button">סיים משימה</button>
                </div>
            `;
            taskList.appendChild(li);
        });

        // הוספת מאזינים לכפתורי סיום משימה
        document.querySelectorAll('.complete-task-button').forEach(button => {
            button.addEventListener('click', () => {
                completeTask(parseInt(button.dataset.id));
            });
        });
    }

    function getUrgencyText(urgency) {
        switch(urgency) {
            case 'low': return 'אין לחץ';
            case 'medium': return 'דחיפות בינונית';
            case 'high': return 'נגמרו התירוצים';
            default: return 'לא צוין';
        }
    }

    function getRepeatText(repeat) {
        switch(repeat) {
            case 'daily': return 'יומי';
            case 'weekly': return 'שבועי';
            case 'monthly': return 'חודשי';
            default: return 'ללא חזרה';
        }
    }

    function completeTask(id) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            task.completed = true;
            if (task.repeat !== 'none') {
                const newTask = {...task, id: Date.now(), completed: false};
                const taskDate = new Date(task.date);
                switch(task.repeat) {
                    case 'daily':
                        newTask.date = new Date(taskDate.getTime() + 24*60*60*1000).toISOString().split('T')[0];
                        break;
                    case 'weekly':
                        newTask.date = new Date(taskDate.getTime() + 7*24*60*60*1000).toISOString().split('T')[0];
                        break;
                    case 'monthly':
                        newTask.date = new Date(taskDate.setMonth(taskDate.getMonth() + 1)).toISOString().split('T')[0];
                        break;
                }
                tasks.push(newTask);
            }
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            renderStatistics();
            renderCalendar();
        }
    }

    function sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // פונקציות לרינדור סטטיסטיקות ולוח שנה (ניתן להוסיף מימוש לפי הצורך)
    function renderStatistics() {
        // מימוש כאן
    }

    function renderCalendar() {
        // מימוש כאן
    }

    // הוספת מאזינים לאירועים
    taskForm.addEventListener('submit', addTask);
    document.getElementById('addCategoryButton').addEventListener('click', addCategory);
    document.getElementById('taskSearch').addEventListener('input', renderTasks);
    document.getElementById('filterCategory').addEventListener('change', renderTasks);
    document.getElementById('filterUrgency').addEventListener('change', renderTasks);

    // אתחול התצוגה
    updateCategoryDropdown();
    renderTasks();
    renderStatistics();
    renderCalendar();
});
