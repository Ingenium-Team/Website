import { memberApi } from "./member-api.js";

let activeProfile = null;
let activeTasks = [];
let activeSubmissions = [];
let selectedTask = null;
let selectedSubmission = null;
let refreshTimer = null;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setPortalViewVisible(visible) {
  const authView = document.getElementById("memberAuthView");
  const portalView = document.getElementById("memberPortalView");
  if (authView) authView.hidden = visible;
  if (portalView) portalView.hidden = !visible;
}

function renderAuth() {
  const container = document.getElementById("memberAuthView");
  if (!container) return;
  container.innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark">I</div>
          <div>
            <div class="brand-title">Ingenium</div>
            <div class="brand-subtitle">Member Portal</div>
          </div>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in with your member account to view assigned tasks and submit updates.</p>
        <div class="auth-form">
          <div class="field">
            <input id="memberEmail" type="email" placeholder="Email address" autocomplete="email" />
          </div>
          <div class="field">
            <input id="memberPassword" type="password" placeholder="Password" autocomplete="current-password" />
          </div>
          <button class="primary-btn" id="memberLoginBtn" type="button">Sign In</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("memberLoginBtn")?.addEventListener("click", async () => {
    const email = document.getElementById("memberEmail")?.value || "";
    const password = document.getElementById("memberPassword")?.value || "";
    if (!email || !password) {
      showToast("Please enter your email and password", "error");
      return;
    }

    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await initializePortal(data.user.id);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Unable to sign in", "error");
    }
  });
}

async function initializePortal(userId) {
  try {
    const profile = await memberApi.getMemberProfile(userId);
    if (!profile) throw new Error("Profile not found");

    const normalizedRole = String(profile.role || "").trim().toLowerCase();
    if (normalizedRole.includes("admin")) {
      window.location.replace("../admin/dashboard.html");
      return;
    }

    if (!normalizedRole.includes("member")) {
      showToast("Your account is not authorized for the member portal", "error");
      return;
    }

    activeProfile = profile;
    setPortalViewVisible(true);
    renderPortal();
    await refreshPortalData();
    startAutoRefresh();
  } catch (error) {
    console.error(error);
    showToast("Unable to load your portal", "error");
  }
}

function startAutoRefresh() {
  if (refreshTimer) window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(() => {
    refreshPortalData().catch((error) => console.warn(error));
  }, 10000);
}

async function refreshPortalData() {
  if (!activeProfile?.department) return;

  const [tasks, submissions] = await Promise.all([
    memberApi.loadMemberTasks(activeProfile.department),
    memberApi.loadMemberSubmissions(activeProfile.id)
  ]);

  activeTasks = tasks || [];
  activeSubmissions = submissions || [];
  renderPortal();
}

function renderPortal() {
  const container = document.getElementById("memberPortalView");
  if (!container) return;

  if (!activeProfile) {
    setPortalViewVisible(false);
    renderAuth();
    return;
  }

  const stats = getStats();
  container.innerHTML = `
    <div class="portal-shell">
      <header class="portal-header">
        <div class="brand">
          <div class="brand-mark">I</div>
          <div>
            <div class="brand-title">Ingenium</div>
            <div class="brand-subtitle">Member Portal</div>
          </div>
        </div>
        <button class="ghost-btn" id="memberLogoutBtn" type="button">Logout</button>
      </header>

      <section class="welcome-card">
        <div class="profile-pill">
          <div class="avatar">${escapeHtml((activeProfile.full_name || "M").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase())}</div>
          <div>
            <h2>${escapeHtml(activeProfile.full_name || "Member")}</h2>
            <p>${escapeHtml(activeProfile.department || "Department")}</p>
          </div>
        </div>
        <div class="status-pill">Member</div>
      </section>

      <section class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Tasks</div>
          <div class="value">${stats.totalTasks}</div>
        </div>
        <div class="stat-card">
          <div class="label">Completed</div>
          <div class="value">${stats.completed}</div>
        </div>
        <div class="stat-card">
          <div class="label">Pending</div>
          <div class="value">${stats.pending}</div>
        </div>
        <div class="stat-card">
          <div class="label">Needs Revision</div>
          <div class="value">${stats.needsRevision}</div>
        </div>
      </section>

      <section class="tasks-section">
        <div class="section-title-row">
          <h3>Active Tasks</h3>
        </div>
        <div class="tasks-grid" id="tasksGrid"></div>
      </section>
    </div>
  `;

  renderTasks();
  document.getElementById("memberLogoutBtn")?.addEventListener("click", async () => {
    await memberApi.signOut();
    activeProfile = null;
    activeTasks = [];
    activeSubmissions = [];
    if (refreshTimer) window.clearInterval(refreshTimer);
    renderAuth();
    setPortalViewVisible(false);
  });
}

function getStats() {
  const completed = activeSubmissions.filter((submission) => submission.status === "Approved").length;
  const pending = activeSubmissions.filter((submission) => submission.status === "Pending" || !submission.status).length;
  const needsRevision = activeSubmissions.filter((submission) => submission.status === "Needs Revision").length;

  return {
    totalTasks: activeTasks.length,
    completed,
    pending,
    needsRevision
  };
}

function renderTasks() {
  const tasksGrid = document.getElementById("tasksGrid");
  if (!tasksGrid) return;

  if (!activeTasks.length) {
    tasksGrid.innerHTML = '<div class="empty-state">No published tasks are available for your department right now.</div>';
    return;
  }

  tasksGrid.innerHTML = activeTasks.map((task) => {
    const submission = activeSubmissions.find((item) => item.task_id === task.id);
    const submissionStatus = submission?.status || "";
    const isSubmitted = Boolean(submission);

    return `
      <article class="task-card">
        <div class="task-top">
          <div>
            <h4>${escapeHtml(task.title || "Untitled task")}</h4>
            <div class="task-meta">${escapeHtml(task.department || "Department")}</div>
          </div>
          <div class="status-pill ${submissionStatus.toLowerCase()}">${escapeHtml(submissionStatus || "Open")}</div>
        </div>
        <p class="task-meta">${escapeHtml(task.description || "No description")}</p>
        <div class="task-meta">Priority: ${escapeHtml(task.priority || "Medium")}</div>
        <div class="task-meta">Deadline: ${escapeHtml(task.deadline || "No deadline")}</div>
        <div class="task-actions">
          ${task.attachment_url ? `<a class="subtle-btn" href="${task.attachment_url}" target="_blank" rel="noreferrer">Download Attachment</a>` : ""}
          ${isSubmitted && submissionStatus === "Needs Revision" ? `<button class="primary-btn" data-action="resubmit" data-task-id="${task.id}">Resubmit</button>` : ""}
          ${!isSubmitted ? `<button class="primary-btn" data-action="submit" data-task-id="${task.id}">Submit Task</button>` : ""}
          ${isSubmitted ? `<button class="ghost-btn" data-action="view" data-task-id="${task.id}">View Submission</button>` : ""}
        </div>
        ${submission?.review_comment && submissionStatus === "Needs Revision" ? `<div class="task-meta" style="margin-top:0.7rem; color:#ffd08a;">Review comment: ${escapeHtml(submission.review_comment)}</div>` : ""}
        ${isSubmitted ? `<div class="task-meta">Submitted: ${escapeHtml(submission.submitted_at || "—")}</div>` : ""}
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-action='submit']").forEach((button) => {
    button.addEventListener("click", () => openSubmissionModal(button.dataset.taskId));
  });

  document.querySelectorAll("[data-action='resubmit']").forEach((button) => {
    button.addEventListener("click", () => openSubmissionModal(button.dataset.taskId));
  });

  document.querySelectorAll("[data-action='view']").forEach((button) => {
    button.addEventListener("click", () => openSubmissionDetails(button.dataset.taskId));
  });
}

function openSubmissionModal(taskId) {
  selectedTask = activeTasks.find((task) => task.id === taskId) || null;
  selectedSubmission = activeSubmissions.find((submission) => submission.task_id === taskId) || null;

  document.getElementById("submissionModalTitle").textContent = selectedSubmission ? "Resubmit Task" : "Submit Task";
  document.getElementById("submissionNotes").value = selectedSubmission?.notes || "";
  document.getElementById("submissionGithub").value = selectedSubmission?.github_link || "";
  document.getElementById("submissionDrive").value = selectedSubmission?.drive_link || "";
  document.getElementById("submissionFile").value = "";
  document.getElementById("submitTaskBtn").textContent = selectedSubmission ? "Resubmit" : "Submit";
  document.getElementById("submitTaskBtn").onclick = () => submitCurrentTask();
  openModal("submissionModal");
}

async function submitCurrentTask() {
  if (!selectedTask) return;

  const notes = document.getElementById("submissionNotes").value.trim();
  const githubLink = document.getElementById("submissionGithub").value.trim();
  const driveLink = document.getElementById("submissionDrive").value.trim();
  const file = document.getElementById("submissionFile").files?.[0] || null;

  if (!notes && !file && !githubLink && !driveLink) {
    showToast("Please add at least one piece of submission content", "error");
    return;
  }

  try {
    let fileUrl = selectedSubmission?.file_url || null;
    if (file) {
      fileUrl = await memberApi.uploadSubmissionFile(file);
    }

    const payload = {
      task_id: selectedTask.id,
      task_title: selectedTask.title,
      member_id: activeProfile.id,
      member_name: activeProfile.full_name,
      notes,
      file_url: fileUrl,
      github_link: githubLink || null,
      drive_link: driveLink || null,
      status: "Pending",
      submitted_at: new Date().toISOString()
    };

    if (selectedSubmission?.id) {
      await memberApi.updateSubmissionStatus(selectedSubmission.id, "Pending", "");
    } else {
      await memberApi.submitTaskSubmission(payload);
    }

    showToast("Submission saved successfully", "success");
    closeModal("submissionModal");
    await refreshPortalData();
  } catch (error) {
    console.error(error);
    showToast("Unable to submit task", "error");
  }
}

function openSubmissionDetails(taskId) {
  const submission = activeSubmissions.find((item) => item.task_id === taskId);
  if (!submission) return;

  selectedSubmission = submission;
  document.getElementById("submissionDetailContent").innerHTML = `
    <div class="submission-detail-card">
      <strong>Task</strong>
      <span>${escapeHtml(submission.task_title || "Task")}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Status</strong>
      <span>${escapeHtml(submission.status || "Pending")}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Notes</strong>
      <span>${escapeHtml(submission.notes || "No notes")}</span>
    </div>
    <div class="submission-detail-card">
      <strong>File</strong>
      <span>${submission.file_url ? `<a href="${submission.file_url}" target="_blank" rel="noreferrer">Open file</a>` : "No file"}</span>
    </div>
    <div class="submission-detail-card">
      <strong>GitHub</strong>
      <span>${submission.github_link ? `<a href="${submission.github_link}" target="_blank" rel="noreferrer">Open GitHub</a>` : "No GitHub link"}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Drive</strong>
      <span>${submission.drive_link ? `<a href="${submission.drive_link}" target="_blank" rel="noreferrer">Open Drive</a>` : "No Drive link"}</span>
    </div>
    ${submission.review_comment ? `<div class="submission-detail-card"><strong>Review Comment</strong><span>${escapeHtml(submission.review_comment)}</span></div>` : ""}
  `;
  openModal("viewSubmissionModal");
}

function initMemberUI() {
  renderAuth();
  setPortalViewVisible(false);
}

const memberUI = {
  initMemberUI,
  initializePortal,
  renderAuth,
  renderPortal,
  refreshPortalData
};

window.memberUI = memberUI;
window.initMemberUI = initMemberUI;
export { memberUI, initMemberUI };
