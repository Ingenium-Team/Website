class GalleryAPI {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  async getAll() {
    const { data, error } = await this.client
      .from("gallery")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async create(item) {
    const { data, error } = await this.client
      .from("gallery")
      .insert([item])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async update(id, updates) {
    const { data, error } = await this.client
      .from("gallery")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data?.[0];
  }

  async delete(id) {
    const { error } = await this.client.from("gallery").delete().eq("id", id);
    if (error) throw error;
  }

  async toggleFeatured(id, featured) {
    return this.update(id, { featured });
  }

  async updateOrder(ids) {
    const updates = ids.map((id, index) => ({ id, display_order: index }));
    const results = await Promise.all(
      updates.map((entry) => this.client.from("gallery").update({ display_order: entry.display_order }).eq("id", entry.id))
    );
    const errors = results.filter((result) => result.error);
    if (errors.length) throw new Error("Failed to update gallery order");
  }

  async uploadImage(file) {
    const timestamp = Date.now();
    const filePath = `${timestamp}-${file.name}`;

    const { error } = await this.client.storage.from("gallery").upload(filePath, file);
    if (error) {
      console.error(error);
      throw error;
    }

    const { data } = this.client.storage.from("gallery").getPublicUrl(filePath);
    return data.publicUrl;
  }
}

const galleryAPI = new GalleryAPI(window.supabaseClient);
window.galleryAPI = galleryAPI;
window.GalleryAPI = GalleryAPI;

export { GalleryAPI, galleryAPI };