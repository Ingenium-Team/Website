import { tasksAPI } from "./tasks-api.js";
import { TRACKS } from "./utils.js";

let tasksList = [];
let filteredTasks = [];
let selectedTask = null;
let isTaskEditMode = false;
let tasksPage = 1;
const tasksPerPage = 8;
let taskFilters = {
  search: "",
  department: "",
  status: "",
  priority: "",
  sort: "newest"
};

function getDepartmentOptions() {
  return TRACKS.map((track) => track.key);
}

function getPriorityOptions() {
  return ["Low", "Medium", "High", "Critical"];
}

function getStatusOptions() {
  return ["Draft", "Published", "Closed"];
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function initTasksUI() {
  if (!document.getElementById("tasksView")) return;
  renderTasksShell();
  await loadTasks();
  attachTaskEventListeners();
}

function renderTasksShell() {
  const container = document.getElementById("tasksView");
  if (!container) return;

  container.innerHTML = `
    <div class="task-module-shell">
      <div class="task-toolbar">
        <label class="toolbar-search" for="taskSearch">
          <span>🔎</span>
          <input id="taskSearch" type="search" placeholder="Search tasks by title">
        </label>
        <div class="task-toolbar-group">
          <div class="task-filters">
            <select class="toolbar-select" id="taskDepartmentFilter">
              <option value="">All Departments</option>
            </select>
            <select class="toolbar-select" id="taskStatusFilter">
              <option value="">All Statuses</option>
            </select>
            <select class="toolbar-select" id="taskPriorityFilter">
              <option value="">All Priorities</option>
            </select>
            <select class="toolbar-select" id="taskSortFilter">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <button class="primary-btn" id="addTaskBtn" type="button">+ Create Task</button>
        </div>
      </div>
      <div class="task-table-wrapper">
        <table class="task-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tasksTableBody"></tbody>
        </table>
      </div>
      <div class="task-card-list" id="tasksMobileList"></div>
      <div class="pagination" id="tasksPagination"></div>
    </div>
  `;

  populateTaskFilters();
}

function populateTaskFilters() {
  const deptFilter = document.getElementById("taskDepartmentFilter");
  const statusFilter = document.getElementById("taskStatusFilter");
  const priorityFilter = document.getElementById("taskPriorityFilter");

  if (deptFilter) {
    deptFilter.innerHTML = `<option value="">All Departments</option>${getDepartmentOptions().map((dept) => `<option value="${dept}">${dept}</option>`).join("")}`;
  }

  if (statusFilter) {
    statusFilter.innerHTML = `<option value="">All Statuses</option>${getStatusOptions().map((status) => `<option value="${status}">${status}</option>`).join("")}`;
  }

  if (priorityFilter) {
    priorityFilter.innerHTML = `<option value="">All Priorities</option>${getPriorityOptions().map((priority) => `<option value="${priority}">${priority}</option>`).join("")}`;
  }
}

async function loadTasks() {
  const tableBody = document.getElementById("tasksTableBody");
  const mobileList = document.getElementById("tasksMobileList");
  const pagination = document.getElementById("tasksPagination");

  if (tableBody) tableBody.innerHTML = `<tr><td colspan="7"><div class="task-skeleton-state"><div class="task-skeleton-row"></div><div class="task-skeleton-row"></div><div class="task-skeleton-row"></div></div></td></tr>`;
  if (mobileList) mobileList.innerHTML = '<div class="task-skeleton-state">Loading tasks…</div>';
  if (pagination) pagination.innerHTML = "";

  try {
    tasksList = await tasksAPI.getAll();
    applyTaskFilters();
    renderTasks();
  } catch (error) {
    console.error("Failed to load tasks", error);
    showToast("Failed to load tasks", "error");
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="7"><div class="task-empty-state">Unable to load tasks right now.</div></td></tr>';
    if (mobileList) mobileList.innerHTML = '<div class="task-empty-state">Unable to load tasks right now.</div>';
  }
}

function applyTaskFilters() {
  let nextTasks = [...tasksList];

  if (taskFilters.search) {
    const query = taskFilters.search.toLowerCase();
    nextTasks = nextTasks.filter((task) => (task.title || "").toLowerCase().includes(query));
  }

  if (taskFilters.department) {
    nextTasks = nextTasks.filter((task) => task.department === taskFilters.department);
  }

  if (taskFilters.status) {
    nextTasks = nextTasks.filter((task) => task.status === taskFilters.status);
  }

  if (taskFilters.priority) {
    nextTasks = nextTasks.filter((task) => task.priority === taskFilters.priority);
  }

  if (taskFilters.sort === "deadline") {
    nextTasks.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
  } else if (taskFilters.sort === "priority") {
    const priorityOrder = { Low: 0, Medium: 1, High: 2, Critical: 3 };
    nextTasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
  } else if (taskFilters.sort === "oldest") {
    nextTasks.sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
  } else {
    nextTasks.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }

  filteredTasks = nextTasks;
  tasksPage = 1;
}

function renderTasks() {
  const startIndex = (tasksPage - 1) * tasksPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + tasksPerPage);

  const tableBody = document.getElementById("tasksTableBody");
  const mobileList = document.getElementById("tasksMobileList");
  const pagination = document.getElementById("tasksPagination");

  if (!tableBody || !mobileList || !pagination) return;

  if (!paginatedTasks.length) {
    tableBody.innerHTML = '<tr><td colspan="6"><div class="task-empty-state">No tasks found. Create one to get started.</div></td></tr>';
    mobileList.innerHTML = '<div class="task-empty-state">No tasks found. Create one to get started.</div>';
    pagination.innerHTML = "";
    return;
  }

  tableBody.innerHTML = paginatedTasks.map((task) => `
    <tr>
      <td>
        <div class="task-title-cell">
          <strong>${escapeHtml(task.title || "Untitled task")}</strong>
          <span>${escapeHtml(task.description || "No description")}</span>
        </div>
      </td>
      <td>${escapeHtml(task.department || "—")}</td>
      <td><span class="task-badge ${String(task.priority || "Medium").toLowerCase()}">${escapeHtml(task.priority || "Medium")}</span></td>
      <td>${escapeHtml(task.deadline || "—")}</td>
      <td><span class="task-pill ${String(task.status || "Draft").toLowerCase()}">${escapeHtml(task.status || "Draft")}</span></td>
      <td>
        <div class="task-action-group">
          <button class="btn-view" data-action="view" data-id="${task.id}">View</button>
          <button class="btn-edit" data-action="edit" data-id="${task.id}">Edit</button>
          <button class="btn-duplicate" data-action="duplicate" data-id="${task.id}">Duplicate</button>
          <button class="btn-delete" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  mobileList.innerHTML = paginatedTasks.map((task) => `
    <article class="task-card">
      <div class="task-card-header">
        <div>
          <strong>${escapeHtml(task.title || "Untitled task")}</strong>
          <div class="task-inline-meta">
            <span>${escapeHtml(task.department || "—")}</span>
          </div>
        </div>
        <span class="task-badge ${String(task.priority || "Medium").toLowerCase()}">${escapeHtml(task.priority || "Medium")}</span>
      </div>
      <p>${escapeHtml(task.description || "No description")}</p>
      <div class="task-card-footer">
        <span>${escapeHtml(task.deadline || "—")}</span>
        <span class="task-pill ${String(task.status || "Draft").toLowerCase()}">${escapeHtml(task.status || "Draft")}</span>
      </div>
      <div class="task-card-actions">
        <button class="btn-view" data-action="view" data-id="${task.id}">View</button>
        <button class="btn-edit" data-action="edit" data-id="${task.id}">Edit</button>
        <button class="btn-duplicate" data-action="duplicate" data-id="${task.id}">Duplicate</button>
        <button class="btn-delete" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    </article>
  `).join("");

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / tasksPerPage));
  pagination.innerHTML = `
    <button type="button" ${tasksPage === 1 ? "disabled" : ""} data-page="prev">← Previous</button>
    <span>Page ${tasksPage} of ${totalPages}</span>
    <button type="button" ${tasksPage === totalPages ? "disabled" : ""} data-page="next">Next →</button>
  `;

  attachTaskEventListeners();
}

function attachTaskEventListeners() {
  document.querySelectorAll("[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => openTaskModal(button.dataset.id));
  });

  document.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => editTask(button.dataset.id));
  });

  document.querySelectorAll("[data-action='duplicate']").forEach((button) => {
    button.addEventListener("click", async () => {
      await duplicateTask(button.dataset.id);
    });
  });

  document.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteTask(button.dataset.id);
    });
  });

  document.getElementById("addTaskBtn")?.addEventListener("click", () => openTaskModal());

  document.getElementById("taskSearch")?.addEventListener("input", (event) => {
    taskFilters.search = event.target.value.trim();
    applyTaskFilters();
    renderTasks();
  });

  document.getElementById("taskDepartmentFilter")?.addEventListener("change", (event) => {
    taskFilters.department = event.target.value;
    applyTaskFilters();
    renderTasks();
  });

  document.getElementById("taskStatusFilter")?.addEventListener("change", (event) => {
    taskFilters.status = event.target.value;
    applyTaskFilters();
    renderTasks();
  });

  document.getElementById("taskPriorityFilter")?.addEventListener("change", (event) => {
    taskFilters.priority = event.target.value;
    applyTaskFilters();
    renderTasks();
  });

  document.getElementById("taskSortFilter")?.addEventListener("change", (event) => {
    taskFilters.sort = event.target.value;
    applyTaskFilters();
    renderTasks();
  });

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.page === "next") {
        tasksPage += 1;
      } else if (button.dataset.page === "prev") {
        tasksPage = Math.max(1, tasksPage - 1);
      }
      renderTasks();
    });
  });
}

function ensureTaskModalMarkup() {
  if (document.getElementById("taskModal")) return;

  const modalMarkup = `
    <div class="modal task-modal" id="taskModal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="taskModalTitle">Create Task</h3>
          <button class="modal-close" data-modal-close="taskModal" type="button">×</button>
        </div>
        <div class="task-form-grid">
          <div class="field">
            <label for="taskTitle">Title</label>
            <input id="taskTitle" type="text" placeholder="Task title">
          </div>
          <div class="field">
            <label for="taskDepartment">Department</label>
            <select id="taskDepartment"></select>
          </div>
          <div class="field">
            <label for="taskDeadline">Deadline</label>
            <input id="taskDeadline" type="date">
          </div>
          <div class="field">
            <label for="taskPriority">Priority</label>
            <select id="taskPriority"></select>
          </div>
          <div class="field">
            <label for="taskStatus">Status</label>
            <select id="taskStatus"></select>
          </div>
          <div class="field full-width">
            <label for="taskDescription">Description</label>
            <textarea id="taskDescription" placeholder="Describe the task..."></textarea>
          </div>
          <div class="field full-width">
            <label>Attachment</label>
            <input id="taskAttachmentInput" type="file">
            <div class="task-file-note" id="taskAttachmentMeta">Optional. Upload a file when the task needs supporting material.</div>
          </div>
        </div>
        <div class="confirm-actions task-modal-actions">
          <button class="ghost-btn" data-modal-close="taskModal" type="button">Cancel</button>
          <button class="primary-btn" id="saveTaskBtn" type="button">Save Task</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalMarkup);
  window.attachModalCloseHandlers?.();
  populateTaskFormFields();
}

function populateTaskFormFields() {
  const departmentSelect = document.getElementById("taskDepartment");
  const prioritySelect = document.getElementById("taskPriority");
  const statusSelect = document.getElementById("taskStatus");

  if (departmentSelect) {
    departmentSelect.innerHTML = getDepartmentOptions().map((dept) => `<option value="${dept}">${dept}</option>`).join("");
  }

  if (prioritySelect) {
    prioritySelect.innerHTML = getPriorityOptions().map((priority) => `<option value="${priority}">${priority}</option>`).join("");
  }

  if (statusSelect) {
    statusSelect.innerHTML = getStatusOptions().map((status) => `<option value="${status}">${status}</option>`).join("");
  }

}

async function openTaskModal(taskId = null) {
  ensureTaskModalMarkup();
  attachTaskModalHandlers();
  if (taskId) {
    selectedTask = tasksList.find((task) => task.id === taskId) || null;
    isTaskEditMode = Boolean(selectedTask);
    fillTaskForm(selectedTask);
  } else {
    selectedTask = null;
    isTaskEditMode = false;
    resetTaskForm();
  }
  document.getElementById("taskModalTitle").textContent = isTaskEditMode ? "Edit Task" : "Create Task";
  openModal("taskModal");
}

function resetTaskForm() {
  const form = document.getElementById("taskModal");
  if (!form) return;
  form.querySelector("#taskTitle").value = "";
  form.querySelector("#taskDescription").value = "";
  form.querySelector("#taskDepartment").value = "";
  form.querySelector("#taskDeadline").value = "";
  form.querySelector("#taskPriority").value = "Medium";
  form.querySelector("#taskStatus").value = "Draft";
  form.querySelector("#taskAttachmentInput").value = "";
  form.querySelector("#taskAttachmentMeta").textContent = "Optional. Upload a file when the task needs supporting material.";
}

function fillTaskForm(task) {
  const form = document.getElementById("taskModal");
  if (!form || !task) return;
  form.querySelector("#taskTitle").value = task.title || "";
  form.querySelector("#taskDescription").value = task.description || "";
  form.querySelector("#taskDepartment").value = task.department || "";
  form.querySelector("#taskDeadline").value = task.deadline || "";
  form.querySelector("#taskPriority").value = task.priority || "Medium";
  form.querySelector("#taskStatus").value = task.status || "Draft";
  form.querySelector("#taskAttachmentMeta").textContent = task.attachment_url ? "Existing attachment available." : "Optional. Upload a file when the task needs supporting material.";
}

function attachTaskModalHandlers() {
  document.getElementById("saveTaskBtn")?.addEventListener("click", saveTask);
}

async function saveTask() {
  const form = document.getElementById("taskModal");
  if (!form) return;

  const title = form.querySelector("#taskTitle").value.trim();
  const description = form.querySelector("#taskDescription").value.trim();
  const department = form.querySelector("#taskDepartment").value;
  const deadline = form.querySelector("#taskDeadline").value;
  const priority = form.querySelector("#taskPriority").value;
  const status = form.querySelector("#taskStatus").value;
  const attachmentFile = form.querySelector("#taskAttachmentInput").files?.[0] || null;

  if (!title || !description || !department || !priority || !status) {
    showToast("Please fill in the required fields before saving.", "error");
    return;
  }

  try {
    let attachmentUrl = selectedTask?.attachment_url || null;
    if (attachmentFile) {
      attachmentUrl = await tasksAPI.uploadTaskAttachment(attachmentFile);
    }

    const payload = {
      title,
      description,
      department,
      deadline: deadline || null,
      priority,
      status,
      attachment_url: attachmentUrl
    };

    if (isTaskEditMode && selectedTask?.id) {
      await tasksAPI.update(selectedTask.id, payload);
      showToast("Task updated successfully", "success");
    } else {
      await tasksAPI.create(payload);
      showToast("Task created successfully", "success");
    }

    closeModal("taskModal");
    await loadTasks();
  } catch (error) {
    console.error("Error saving task", error);
    showToast("Unable to save task", "error");
  }
}

async function editTask(taskId) {
  await openTaskModal(taskId);
}

async function duplicateTask(taskId) {
  try {
    await tasksAPI.duplicate(taskId);
    showToast("Task duplicated", "success");
    await loadTasks();
  } catch (error) {
    console.error("Error duplicating task", error);
    showToast("Unable to duplicate task", "error");
  }
}

async function deleteTask(taskId) {
  if (!window.confirm("Delete this task?")) return;

  try {
    await tasksAPI.delete(taskId);
    showToast("Task deleted", "success");
    await loadTasks();
  } catch (error) {
    console.error("Error deleting task", error);
    showToast("Unable to delete task", "error");
  }
}

const tasksUI = {
  initTasksUI,
  loadTasks,
  openTaskModal,
  saveTask,
  editTask,
  duplicateTask,
  deleteTask
};

window.tasksUI = tasksUI;
window.initTasksUI = initTasksUI;
window.openTaskModal = openTaskModal;
window.saveTask = saveTask;

export { initTasksUI, tasksUI };
