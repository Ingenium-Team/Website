// Admin Events API Module
// Handles CRUD operations for events in Supabase

class EventsAPI {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  /**
   * Fetch all events
   */
  async getAll() {
    const query = this.client.from("events").select("*");
    const ordered = query.order ? query : null;

    if (!ordered) {
      return [];
    }

    const { data, error } = await ordered.order("display_order", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new event
   */
  async create(event) {
    const { data, error } = await this.client
      .from("events")
      .insert([event])
      .select();

    if (error) throw error;
    return data[0];
  }

  /**
   * Update an event
   */
  async update(id, updates) {
    const { data, error } = await this.client
      .from("events")
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
   * Delete an event
   */
  async delete(id) {
    const { error } = await this.client
      .from("events")
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
  async updateOrder(events) {
    const updates = events.map((event, index) => ({
      id: event.id,
      display_order: index
    }));

    const promises = updates.map(update =>
      this.client
        .from("events")
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
   * Search events
   */
  async search(query) {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

// Export for use in admin dashboard
const eventsAPI = new EventsAPI(window.supabaseClient);
window.EventsAPI = EventsAPI;
window.eventsAPI = eventsAPI;

export { EventsAPI, eventsAPI };
