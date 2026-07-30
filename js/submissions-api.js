import { submissionsAPI } from "./tasks-api.js";

const submissionsUI = {
  async loadAssignedTasks(memberId) {
    return submissionsAPI.loadAssignedTasks(memberId);
  },

  async submitTask(payload) {
    return submissionsAPI.submitTask(payload);
  },

  async uploadSubmission(file) {
    return submissionsAPI.uploadSubmission(file);
  },

  async uploadSubmissionFile(file) {
    return submissionsAPI.uploadSubmissionFile(file);
  },

  async loadSubmissionHistory(memberId) {
    return submissionsAPI.loadSubmissionHistory(memberId);
  }
};

async function loadAssignedTasks(memberId) {
  return submissionsAPI.loadAssignedTasks(memberId);
}

async function submitTask(payload) {
  return submissionsAPI.submitTask(payload);
}

async function uploadSubmission(file) {
  return submissionsAPI.uploadSubmission(file);
}

async function loadSubmissionHistory(memberId) {
  return submissionsAPI.loadSubmissionHistory(memberId);
}

window.submissionsUI = submissionsUI;
window.loadAssignedTasks = loadAssignedTasks;
window.submitTask = submitTask;
window.uploadSubmission = uploadSubmission;
window.loadSubmissionHistory = loadSubmissionHistory;

export { submissionsUI, loadAssignedTasks, submitTask, uploadSubmission, loadSubmissionHistory };
