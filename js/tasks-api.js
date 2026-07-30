const TASKS_TABLE = "tasks";
const TASK_BUCKET = "tasks";
const SUBMISSIONS_TABLE = "task_submissions";

class TasksAPI {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  async getAll() {
    const { data, error } = await this.client
      .from(TASKS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id) {
    const { data, error } = await this.client
      .from(TASKS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(task) {
    const payload = {
      ...task,
      created_at: task.created_at || new Date().toISOString(),
      updated_at: task.updated_at || new Date().toISOString()
    };

    const { data, error } = await this.client
      .from(TASKS_TABLE)
      .insert([payload])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async update(id, updates) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from(TASKS_TABLE)
      .update(payload)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async delete(id) {
    const existingTask = await this.getById(id);
    if (existingTask?.attachment_url) {
      await this.deleteAttachment(existingTask.attachment_url);
    }

    const { error } = await this.client.from(TASKS_TABLE).delete().eq("id", id);
    if (error) throw error;
  }

  async duplicate(id) {
    const task = await this.getById(id);
    const duplicated = {
      ...task,
      title: `${task.title || "Task"} (Copy)`,
      status: "Draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    delete duplicated.id;
    return this.create(duplicated);
  }

  async deleteAttachment(attachmentUrl) {
    if (!attachmentUrl) return;

    const storagePath = this.getStoragePathFromUrl(attachmentUrl);
    if (!storagePath) return;

    console.log("Deleting from bucket:\n tasks");
    const { error } = await this.client.storage.from(TASK_BUCKET).remove([storagePath]);
    if (error) {
      console.warn("Unable to delete task attachment from storage", error);
    }
  }

  getStoragePathFromUrl(url) {
    if (!url) return null;

    try {
      const parsedUrl = new URL(url);
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const bucketIndex = segments.indexOf(TASK_BUCKET);
      if (bucketIndex >= 0) {
        return segments.slice(bucketIndex + 1).join("/");
      }

      return segments[segments.length - 1] || null;
    } catch (error) {
      console.warn("Unable to parse attachment URL", error);
      return null;
    }
  }

  async uploadTaskAttachment(file) {
    if (!file) return null;

    console.log("Uploading to bucket:\n tasks");
    const filePath = `${Date.now()}-${file.name}`;
    const { error } = await this.client.storage.from(TASK_BUCKET).upload(filePath, file);
    if (error) throw error;

    const { data } = this.client.storage.from(TASK_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadAttachment(file) {
    return this.uploadTaskAttachment(file);
  }
}

class SubmissionsAPI {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  async loadAssignedTasks(memberOrDepartment) {
    const department = typeof memberOrDepartment === "string"
      ? memberOrDepartment
      : memberOrDepartment?.department;

    if (!department) {
      return [];
    }

    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("department", department)
      .order("deadline", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async submitTask(payload) {
    const { data, error } = await this.client
      .from(SUBMISSIONS_TABLE)
      .insert([payload])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async uploadSubmission(file) {
    if (!file) return null;

    console.log("Uploading to bucket:\n tasks");
    const filePath = `${Date.now()}-${file.name}`;
    const { error } = await this.client.storage.from(TASK_BUCKET).upload(filePath, file);
    if (error) throw error;

    const { data } = this.client.storage.from(TASK_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadSubmissionFile(file) {
    return this.uploadSubmission(file);
  }

  async loadSubmissionHistory(memberId) {
    const { data, error } = await this.client
      .from(SUBMISSIONS_TABLE)
      .select("*")
      .eq("member_id", memberId)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAll() {
    const { data, error } = await this.client
      .from(SUBMISSIONS_TABLE)
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getById(id) {
    const { data, error } = await this.client
      .from(SUBMISSIONS_TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(id, status, reviewComment = "") {
    const { data, error } = await this.client
      .from(SUBMISSIONS_TABLE)
      .update({ status, review_comment: reviewComment, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data?.[0];
  }
}

const tasksAPI = new TasksAPI(window.supabaseClient);
const submissionsAPI = new SubmissionsAPI(window.supabaseClient);

window.tasksAPI = tasksAPI;
window.submissionsAPI = submissionsAPI;
window.TasksAPI = TasksAPI;
window.SubmissionsAPI = SubmissionsAPI;

export { TasksAPI, tasksAPI, SubmissionsAPI, submissionsAPI };
