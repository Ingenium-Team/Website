class InterviewManagementAPI {
  constructor(client) {
    this.client = client;
  }

  async getSlots() {
    const { data, error } = await this.client
      .from("interview_slots")
      .select("*")
      .order("interview_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getBookings() {
    const { data, error } = await this.client
      .from("interview_bookings")
      .select("*")
      .order("booked_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createSlot(payload) {
    const { data, error } = await this.client
      .from("interview_slots")
      .insert([{
        ...payload,
        status: "available"
      }])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }

  async updateSlot(id, payload) {
    const { data, error } = await this.client
      .from("interview_slots")
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }

  async hasLinkedBookings(slotId) {
    const { data, error } = await this.client
      .from("interview_bookings")
      .select("id")
      .eq("slot_id", slotId)
      .limit(1);

    if (error) throw error;
    return Boolean(data?.length);
  }

  async deleteSlot(id) {
    const linkedBookingExists = await this.hasLinkedBookings(id);

    if (!linkedBookingExists) {
      const { error } = await this.client
        .from("interview_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { action: "deleted" };
    }

    const { data, error } = await this.client
      .from("interview_slots")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    return { action: "cancelled", slot: data?.[0] || null };
  }

  async getSlotByDateAndStart(date, startTime, committee, excludeId = null) {
    let query = this.client
      .from("interview_slots")
      .select("id")
      .eq("interview_date", date)
      .eq("start_time", startTime)
      .eq("committee", committee);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.limit(1);
    if (error) throw error;
    return data?.[0] || null;
  }

  async cancelBooking(bookingId) {
    const { data: booking, error: bookingLookupError } = await this.client
      .from("interview_bookings")
      .select("id, slot_id")
      .eq("id", bookingId)
      .single();

    if (bookingLookupError) throw bookingLookupError;
    if (!booking) {
      throw new Error("booking_not_found");
    }

    const { error: deleteError } = await this.client
      .from("interview_bookings")
      .delete()
      .eq("id", bookingId);

    if (deleteError) throw deleteError;

    if (booking.slot_id) {
      const { error: slotUpdateError } = await this.client
        .from("interview_slots")
        .update({
          status: "available",
          updated_at: new Date().toISOString()
        })
        .eq("id", booking.slot_id);

      if (slotUpdateError) throw slotUpdateError;
    }

    return { bookingId, slotId: booking.slot_id };
  }

  async updateBookingStatus(id, status) {
    const { data, error } = await this.client
      .from("interview_bookings")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  }
}

const interviewManagementAPI = new InterviewManagementAPI(window.supabaseClient);
window.InterviewManagementAPI = InterviewManagementAPI;
window.interviewManagementAPI = interviewManagementAPI;
export { InterviewManagementAPI, interviewManagementAPI };
