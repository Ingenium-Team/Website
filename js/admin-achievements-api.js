// Admin Achievements API Module
// Handles CRUD operations for achievements in Supabase

class AchievementsAPI {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  /**
   * Fetch all achievements
   */
  async getAll() {
    const { data, error } = await this.client
      .from("achievements")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new achievement
   */
  async create(achievement) {
    const { data, error } = await this.client
      .from("achievements")
      .insert([achievement])
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Update an achievement
   */
  async update(id, updates) {
    const { data, error } = await this.client
      .from("achievements")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Delete an achievement
   */
  async delete(id) {
    const { error } = await this.client
      .from("achievements")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(id, featured) {
    return this.update(id, { featured });
  }

  /**
   * Update display order
   */
  async updateOrder(achievements) {
    const updates = achievements.map((achievement, index) => ({
      id: achievement.id,
      display_order: index
    }));

    const promises = updates.map(update =>
      this.client
        .from("achievements")
        .update({ display_order: update.display_order })
        .eq("id", update.id)
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length) throw new Error("Failed to update order");
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(file) {
    const timestamp = Date.now();
    const filePath = `${timestamp}-${file.name}`;

    const { data, error } = await this.client.storage
      .from("achievements")
      .upload(filePath, file);

    if (error) throw error;

    const { data: publicData } = await this.client.storage
      .from("achievements")
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }

  /**
   * Search achievements
   */
  async search(query) {
    const { data, error } = await this.client
      .from("achievements")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

// Export for use in admin dashboard
const achievementsAPI = new AchievementsAPI(supabaseClient);
