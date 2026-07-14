// Projects API Module
// Handles CRUD, visibility, featured state, ordering, and uploads for projects

class ProjectsAPI {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  async getAll() {
    const query = this.client.from("projects").select("*");
    const ordered = query.order ? query : null;

    if (!ordered) {
      return [];
    }

    const { data, error } = await ordered
      .order("featured", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async create(project) {
    const { data, error } = await this.client
      .from("projects")
      .insert([project])
      .select();

    if (error) throw error;
    return data[0];
  }

  async update(id, updates) {
    const { data, error } = await this.client
      .from("projects")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }

  async delete(id) {
    const { error } = await this.client
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async uploadImage(file) {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;

    const { data, error } = await this.client.storage
      .from("achievements")
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicData } = await this.client.storage
      .from("achievements")
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  }

  async toggleFeatured(id, featured) {
    return this.update(id, { featured });
  }

  async toggleVisible(id, visible) {
    return this.update(id, { visible });
  }

  async moveProjectUp(id, projects) {
    const currentIndex = projects.findIndex(project => project.id === id);
    if (currentIndex <= 0) return projects;

    const currentProject = projects[currentIndex];
    const previousProject = projects[currentIndex - 1];

    await Promise.all([
      this.client.from("projects").update({ display_order: currentProject.display_order }).eq("id", previousProject.id),
      this.client.from("projects").update({ display_order: previousProject.display_order }).eq("id", currentProject.id)
    ]);

    return projects;
  }

  async moveProjectDown(id, projects) {
    const currentIndex = projects.findIndex(project => project.id === id);
    if (currentIndex === -1 || currentIndex >= projects.length - 1) return projects;

    const currentProject = projects[currentIndex];
    const nextProject = projects[currentIndex + 1];

    await Promise.all([
      this.client.from("projects").update({ display_order: currentProject.display_order }).eq("id", nextProject.id),
      this.client.from("projects").update({ display_order: nextProject.display_order }).eq("id", currentProject.id)
    ]);

    return projects;
  }

  async search(query) {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .or(`title.ilike.%${query}%,short_description.ilike.%${query}%,full_description.ilike.%${query}%,category.ilike.%${query}%,status.ilike.%${query}%`)
      .order("featured", { ascending: false })
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

const projectsAPI = new ProjectsAPI(window.supabaseClient);
window.ProjectsAPI = ProjectsAPI;
window.projectsAPI = projectsAPI;

export { ProjectsAPI, projectsAPI };
