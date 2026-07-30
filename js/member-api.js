const TASKS_TABLE = "tasks";
const SUBMISSIONS_TABLE = "task_submissions";
const SUBMISSIONS_BUCKET = "submissions";

async function getCurrentUser() {
  const { data, error } = await window.supabaseClient.auth.getUser();
  if (error) throw error;
  return data?.user || null;
}

async function getMemberProfile(userId) {
  const { data, error } = await window.supabaseClient
    .from("profiles")
    .select("id, full_name, department, role, avatar_url")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

async function loadMemberTasks(department) {
  if (!department) return [];

  const { data, error } = await window.supabaseClient
    .from(TASKS_TABLE)
    .select("*")
    .eq("department", department)
    .eq("status", "Published")
    .order("deadline", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function loadMemberSubmissions(memberId) {
  if (!memberId) return [];

  const { data, error } = await window.supabaseClient
    .from(SUBMISSIONS_TABLE)
    .select("*")
    .eq("member_id", memberId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function uploadSubmissionFile(file) {
  if (!file) return null;

  console.log("Uploading to bucket:\n submissions");
  const filePath = `${Date.now()}-${file.name}`;
  const { error } = await window.supabaseClient.storage.from(SUBMISSIONS_BUCKET).upload(filePath, file);
  if (error) throw error;

  const { data } = window.supabaseClient.storage.from(SUBMISSIONS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function submitTaskSubmission(payload) {
  const { data, error } = await window.supabaseClient
    .from(SUBMISSIONS_TABLE)
    .insert([payload])
    .select();

  if (error) throw error;
  return data?.[0];
}

async function updateSubmissionStatus(submissionId, status, reviewComment = "") {
  const { data, error } = await window.supabaseClient
    .from(SUBMISSIONS_TABLE)
    .update({ status, review_comment: reviewComment, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId)
    .select();

  if (error) throw error;
  return data?.[0];
}

async function signOut() {
  await window.supabaseClient.auth.signOut();
}

const memberApi = {
  getCurrentUser,
  getMemberProfile,
  loadMemberTasks,
  loadMemberSubmissions,
  uploadSubmissionFile,
  submitTaskSubmission,
  updateSubmissionStatus,
  signOut
};

window.memberApi = memberApi;
export { memberApi };
