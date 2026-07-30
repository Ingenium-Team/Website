import { submissionsAPI } from "./tasks-api.js";

let submissionsList = [];
let filteredSubmissions = [];
let selectedSubmission = null;
let submissionsPage = 1;
const submissionsPerPage = 8;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function initSubmissionsUI() {
  if (!document.getElementById("submissionsView")) return;
  renderSubmissionsShell();
  await loadSubmissions();
  attachSubmissionEventListeners();
}

function renderSubmissionsShell() {
  const container = document.getElementById("submissionsView");
  if (!container) return;

  container.innerHTML = `
    <div class="task-module-shell">
      <div class="task-toolbar">
        <label class="toolbar-search" for="submissionSearch">
          <span>🔎</span>
          <input id="submissionSearch" type="search" placeholder="Search submissions">
        </label>
        <div class="task-toolbar-group">
          <button class="primary-btn" id="refreshSubmissionsBtn" type="button">↻ Refresh</button>
        </div>
      </div>
      <div class="task-table-wrapper">
        <table class="task-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Member</th>
              <th>Submitted At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="submissionsTableBody"></tbody>
        </table>
      </div>
      <div class="task-card-list" id="submissionsMobileList"></div>
      <div class="pagination" id="submissionsPagination"></div>
    </div>
  `;
}

async function loadSubmissions() {
  const tableBody = document.getElementById("submissionsTableBody");
  const mobileList = document.getElementById("submissionsMobileList");
  const pagination = document.getElementById("submissionsPagination");

  if (tableBody) tableBody.innerHTML = `<tr><td colspan="5"><div class="task-skeleton-state"><div class="task-skeleton-row"></div><div class="task-skeleton-row"></div><div class="task-skeleton-row"></div></div></td></tr>`;
  if (mobileList) mobileList.innerHTML = '<div class="task-skeleton-state">Loading submissions…</div>';
  if (pagination) pagination.innerHTML = "";

  try {
    submissionsList = await submissionsAPI.getAll();
    filteredSubmissions = [...submissionsList];
    renderSubmissions();
  } catch (error) {
    console.error("Failed to load submissions", error);
    showToast("Failed to load submissions", "error");
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="5"><div class="task-empty-state">Unable to load submissions right now.</div></td></tr>';
    if (mobileList) mobileList.innerHTML = '<div class="task-empty-state">Unable to load submissions right now.</div>';
  }
}

function renderSubmissions() {
  const startIndex = (submissionsPage - 1) * submissionsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + submissionsPerPage);
  const tableBody = document.getElementById("submissionsTableBody");
  const mobileList = document.getElementById("submissionsMobileList");
  const pagination = document.getElementById("submissionsPagination");

  if (!tableBody || !mobileList || !pagination) return;

  if (!paginatedSubmissions.length) {
    tableBody.innerHTML = '<tr><td colspan="5"><div class="task-empty-state">No submissions yet.</div></td></tr>';
    mobileList.innerHTML = '<div class="task-empty-state">No submissions yet.</div>';
    pagination.innerHTML = "";
    return;
  }

  tableBody.innerHTML = paginatedSubmissions.map((submission) => `
    <tr>
      <td>${escapeHtml(submission.task_title || submission.task_id || "Task")}</td>
      <td>${escapeHtml(submission.member_name || submission.member_id || "Member")}</td>
      <td>${escapeHtml(submission.submitted_at || "—")}</td>
      <td><span class="submission-status-pill ${String(submission.status || "Pending").toLowerCase()}">${escapeHtml(submission.status || "Pending")}</span></td>
      <td>
        <div class="task-action-group">
          <button class="btn-view" data-action="view-submission" data-id="${submission.id}">View</button>
          <button class="btn-edit" data-action="approve" data-id="${submission.id}">Approve</button>
          <button class="btn-delete" data-action="reject" data-id="${submission.id}">Reject</button>
          <button class="btn-duplicate" data-action="revision" data-id="${submission.id}">Revision</button>
        </div>
      </td>
    </tr>
  `).join("");

  mobileList.innerHTML = paginatedSubmissions.map((submission) => `
    <article class="task-card">
      <div class="task-card-header">
        <div>
          <strong>${escapeHtml(submission.task_title || submission.task_id || "Task")}</strong>
          <div class="task-inline-meta">
            <span>${escapeHtml(submission.member_name || submission.member_id || "Member")}</span>
            <span>•</span>
            <span>${escapeHtml(submission.submitted_at || "—")}</span>
          </div>
        </div>
        <span class="submission-status-pill ${String(submission.status || "Pending").toLowerCase()}">${escapeHtml(submission.status || "Pending")}</span>
      </div>
      <div class="task-card-actions">
        <button class="btn-view" data-action="view-submission" data-id="${submission.id}">View</button>
        <button class="btn-edit" data-action="approve" data-id="${submission.id}">Approve</button>
        <button class="btn-delete" data-action="reject" data-id="${submission.id}">Reject</button>
        <button class="btn-duplicate" data-action="revision" data-id="${submission.id}">Revision</button>
      </div>
    </article>
  `).join("");

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / submissionsPerPage));
  pagination.innerHTML = `
    <button type="button" ${submissionsPage === 1 ? "disabled" : ""} data-page="prev">← Previous</button>
    <span>Page ${submissionsPage} of ${totalPages}</span>
    <button type="button" ${submissionsPage === totalPages ? "disabled" : ""} data-page="next">Next →</button>
  `;

  attachSubmissionEventListeners();
}

function attachSubmissionEventListeners() {
  document.querySelectorAll("[data-action='view-submission']").forEach((button) => {
    button.addEventListener("click", () => openSubmissionModal(button.dataset.id));
  });

  document.querySelectorAll("[data-action='approve']").forEach((button) => {
    button.addEventListener("click", async () => {
      await reviewSubmission(button.dataset.id, "Approved");
    });
  });

  document.querySelectorAll("[data-action='reject']").forEach((button) => {
    button.addEventListener("click", async () => {
      await reviewSubmission(button.dataset.id, "Rejected");
    });
  });

  document.querySelectorAll("[data-action='revision']").forEach((button) => {
    button.addEventListener("click", async () => {
      await reviewSubmission(button.dataset.id, "Needs Revision");
    });
  });

  document.getElementById("refreshSubmissionsBtn")?.addEventListener("click", () => loadSubmissions());
  document.getElementById("submissionSearch")?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    filteredSubmissions = submissionsList.filter((submission) => (submission.task_title || "").toLowerCase().includes(query));
    submissionsPage = 1;
    renderSubmissions();
  });

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.page === "next") {
        submissionsPage += 1;
      } else if (button.dataset.page === "prev") {
        submissionsPage = Math.max(1, submissionsPage - 1);
      }
      renderSubmissions();
    });
  });
}

function ensureSubmissionModalMarkup() {
  if (document.getElementById("submissionModal")) return;

  const modalMarkup = `
    <div class="modal task-modal" id="submissionModal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Submission Review</h3>
          <button class="modal-close" data-modal-close="submissionModal" type="button">×</button>
        </div>
        <div class="submission-detail-grid" id="submissionDetails"></div>
        <div class="field full-width" style="margin-top: 0.8rem;">
          <label for="submissionReviewComment">Review Comment</label>
          <textarea id="submissionReviewComment" placeholder="Leave feedback for the member..."></textarea>
        </div>
        <div class="task-modal-actions" style="display:flex; flex-wrap:wrap; gap:0.6rem; margin-top: 0.8rem;">
          <button class="btn-view" id="approveSubmissionBtn" type="button">Approve</button>
          <button class="btn-delete" id="rejectSubmissionBtn" type="button">Reject</button>
          <button class="btn-duplicate" id="revisionSubmissionBtn" type="button">Needs Revision</button>
          <button class="primary-btn" id="saveSubmissionReviewBtn" type="button">Save Review</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalMarkup);
  window.attachModalCloseHandlers?.();
}

async function openSubmissionModal(submissionId) {
  ensureSubmissionModalMarkup();
  selectedSubmission = submissionsList.find((submission) => submission.id === submissionId) || null;
  if (!selectedSubmission) return;

  const detailsContainer = document.getElementById("submissionDetails");
  detailsContainer.innerHTML = `
    <div class="submission-detail-card">
      <strong>Task</strong>
      <span>${escapeHtml(selectedSubmission.task_title || selectedSubmission.task_id || "Task")}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Member</strong>
      <span>${escapeHtml(selectedSubmission.member_name || selectedSubmission.member_id || "Member")}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Notes</strong>
      <span>${escapeHtml(selectedSubmission.notes || "No notes provided")}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Uploaded File</strong>
      <span>${selectedSubmission.file_url ? `<a class="task-attachment-link" href="${selectedSubmission.file_url}" target="_blank" rel="noreferrer">Open file</a>` : "No file uploaded"}</span>
    </div>
    <div class="submission-detail-card">
      <strong>GitHub Link</strong>
      <span>${selectedSubmission.github_link ? `<a class="task-attachment-link" href="${selectedSubmission.github_link}" target="_blank" rel="noreferrer">Open GitHub</a>` : "No GitHub link"}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Drive Link</strong>
      <span>${selectedSubmission.drive_link ? `<a class="task-attachment-link" href="${selectedSubmission.drive_link}" target="_blank" rel="noreferrer">Open Drive</a>` : "No Drive link"}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Submission Date</strong>
      <span>${escapeHtml(selectedSubmission.submitted_at || "—")}</span>
    </div>
    <div class="submission-detail-card">
      <strong>Review Comment</strong>
      <span>${escapeHtml(selectedSubmission.review_comment || "No review yet")}</span>
    </div>
  `;

  document.getElementById("submissionReviewComment").value = selectedSubmission.review_comment || "";
  document.getElementById("approveSubmissionBtn")?.addEventListener("click", () => saveSubmissionReview("Approved"));
  document.getElementById("rejectSubmissionBtn")?.addEventListener("click", () => saveSubmissionReview("Rejected"));
  document.getElementById("revisionSubmissionBtn")?.addEventListener("click", () => saveSubmissionReview("Needs Revision"));
  document.getElementById("saveSubmissionReviewBtn")?.addEventListener("click", () => saveSubmissionReview("Approved"));
  openModal("submissionModal");
}

async function reviewSubmission(submissionId, status) {
  try {
    await submissionsAPI.updateStatus(submissionId, status);
    showToast(`Submission marked as ${status}`, "success");
    await loadSubmissions();
  } catch (error) {
    console.error("Error reviewing submission", error);
    showToast("Unable to update submission", "error");
  }
}

async function saveSubmissionReview(defaultStatus = "Approved") {
  const reviewComment = document.getElementById("submissionReviewComment")?.value || "";
  if (!selectedSubmission?.id) return;

  try {
    await submissionsAPI.updateStatus(selectedSubmission.id, defaultStatus, reviewComment);
    showToast("Review saved", "success");
    closeModal("submissionModal");
    await loadSubmissions();
  } catch (error) {
    console.error("Error saving review", error);
    showToast("Unable to save review", "error");
  }
}

const submissionsUI = {
  initSubmissionsUI,
  loadSubmissions,
  openSubmissionModal,
  reviewSubmission,
  saveSubmissionReview
};

window.submissionsUI = submissionsUI;
window.initSubmissionsUI = initSubmissionsUI;
window.openSubmissionModal = openSubmissionModal;
window.saveSubmissionReview = saveSubmissionReview;

export { initSubmissionsUI, submissionsUI };
