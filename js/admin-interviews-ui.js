import { interviewManagementAPI } from "./admin-interviews-api.js";

let interviewSlots = [];
let interviewBookings = [];
let selectedInterviewSlot = null;
let interviewEditMode = false;
let interviewHandlersAttached = false;
let interviewSaveInProgress = false;
let interviewFilters = {
  search: "",
  date: "",
  committee: "",
  status: "",
  sort: "newest"
};

function formatAdminDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatAdminTime(timeValue) {
  if (!timeValue) return "—";
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatBookedAt(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatCommitteeLabel(committee) {
  if (!committee) return "Unassigned";
  return committee.charAt(0).toUpperCase() + committee.slice(1);
}

function safeStatusLabel(status) {
  return (status || "").replace(/_/g, " ").toUpperCase();
}

async function initInterviewBookingsUI() {
  try {
    await loadInterviewData();
    attachInterviewHandlers();
    renderInterviewStats();
    renderInterviewSlots();
    renderInterviewBookings();
  } catch (error) {
    console.error("Failed to initialize interview UI:", error);
    showToast("Unable to load interview management data.", "error");
  }
}

async function loadInterviewData() {
  const [slots, bookings] = await Promise.all([
    interviewManagementAPI.getSlots(),
    interviewManagementAPI.getBookings()
  ]);

  interviewSlots = slots;
  interviewBookings = bookings;
}

function renderInterviewStats() {
  const container = document.getElementById("interviewStatsGrid");
  if (!container) return;

  const today = new Date();
  const totalSlots = interviewSlots.length;
  const availableSlots = interviewSlots.filter((slot) => slot.status === "available").length;
  const bookedSlots = interviewBookings.filter((booking) => booking.status === "booked").length;
  const upcomingInterviews = interviewBookings.filter((booking) => {
    const slot = interviewSlots.find((item) => item.id === booking.slot_id);
    if (!slot) return false;
    const bookingDate = new Date(`${slot.interview_date}T00:00:00`);
    return booking.status === "booked" && bookingDate >= today;
  }).length;

  const stats = [
    { icon: "🗓️", title: "Total Slots", value: totalSlots, subtitle: "All configured interview slots" },
    { icon: "✅", title: "Available Slots", value: availableSlots, subtitle: "Open for booking" },
    { icon: "🔒", title: "Booked Slots", value: bookedSlots, subtitle: "Currently reserved" },
    { icon: "⏳", title: "Upcoming Interviews", value: upcomingInterviews, subtitle: "Future confirmed interviews" }
  ];

  container.innerHTML = stats.map((stat) => `
    <article class="metric-card">
      <div class="metric-icon">${stat.icon}</div>
      <div class="metric-title">${stat.title}</div>
      <div class="metric-value">${stat.value}</div>
      <div class="metric-subtitle">${stat.subtitle}</div>
    </article>
  `).join("");
}

function renderInterviewSlots() {
  const container = document.getElementById("interviewSlotsGrid");
  if (!container) return;

  if (!interviewSlots.length) {
    container.innerHTML = `<div class="empty-state">No interview slots created yet.</div>`;
    return;
  }

  container.innerHTML = interviewSlots
    .map((slot) => `
      <div class="panel-card" style="padding: 1rem;">
        <div class="event-header">
          <h4>${formatAdminDate(slot.interview_date)}</h4>
          <span class="badge-featured">${slot.status}</span>
        </div>
        <div class="event-meta">
          <div>🏷️ Committee: ${formatCommitteeLabel(slot.committee)}</div>
          <div>⏰ ${formatAdminTime(slot.start_time)} — ${formatAdminTime(slot.end_time)}</div>
          <div>🧾 Status: ${slot.status}</div>
        </div>
        <div class="event-actions">
          <button class="btn-small btn-edit" data-interview-slot-edit="${slot.id}" type="button" ${slot.status !== "available" ? "disabled" : ""}>Edit</button>
          <button class="btn-small btn-delete" data-interview-slot-delete="${slot.id}" type="button">Delete</button>
        </div>
      </div>
    `)
    .join("");

  container.querySelectorAll("[data-interview-slot-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        showToast("Only available interview slots can be edited.", "error");
        return;
      }
      openInterviewSlotModal(button.dataset.interviewSlotEdit);
    });
  });

  container.querySelectorAll("[data-interview-slot-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteInterviewSlot(button.dataset.interviewSlotDelete));
  });
}

function renderInterviewBookings() {
  const container = document.getElementById("interviewBookingsTableBody");
  if (!container) return;

  const filtered = getFilteredBookings();

  if (!filtered.length) {
    container.innerHTML = `<tr><td colspan="9" class="empty-state">No bookings match the current filters.</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map((booking) => {
    const slot = interviewSlots.find((item) => item.id === booking.slot_id);
    return `
      <tr>
        <td>${booking.applicant_name || "—"}</td>
        <td>${slot ? formatCommitteeLabel(slot.committee) : "—"}</td>
        <td>${slot ? formatAdminDate(slot.interview_date) : "—"}</td>
        <td>${slot ? `${formatAdminTime(slot.start_time)} — ${formatAdminTime(slot.end_time)}` : "—"}</td>
        <td>${booking.applicant_email || "—"}</td>
        <td>${booking.applicant_phone || "—"}</td>
        <td>${safeStatusLabel(booking.status)}</td>
        <td>${formatBookedAt(booking.booked_at)}</td>
        <td>
          <div class="booking-actions">
            <button class="btn-small btn-edit" data-booking-view="${booking.id}" type="button">View</button>
            <button class="btn-small" data-booking-cancel-id="${booking.id}" type="button">Cancel Booking</button>
            <button class="btn-small" data-booking-status="completed" data-booking-id="${booking.id}" type="button">Mark Completed</button>
            <button class="btn-small btn-delete" data-booking-status="no_show" data-booking-id="${booking.id}" type="button">Mark No Show</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  container.querySelectorAll("[data-booking-view]").forEach((button) => {
    button.addEventListener("click", () => showInterviewBookingDetails(button.dataset.bookingView));
  });

  container.querySelectorAll("[data-booking-cancel-id]").forEach((button) => {
    button.addEventListener("click", () => cancelInterviewBooking(button.dataset.bookingCancelId));
  });

  container.querySelectorAll("[data-booking-status]").forEach((button) => {
    button.addEventListener("click", () => updateInterviewBookingStatus(button.dataset.bookingId, button.dataset.bookingStatus));
  });
}

function getFilteredBookings() {
  const search = interviewFilters.search.trim().toLowerCase();
  const date = interviewFilters.date;
  const committee = interviewFilters.committee;
  const status = interviewFilters.status;

  return interviewBookings
    .filter((booking) => {
      const slot = interviewSlots.find((item) => item.id === booking.slot_id);
      const matchesName = !search || booking.applicant_name?.toLowerCase().includes(search) || false;
      const matchesEmail = !search || booking.applicant_email?.toLowerCase().includes(search) || false;
      const matchesCommittee = !committee || slot?.committee === committee;
      const matchesDate = !date || slot?.interview_date === date;
      const matchesStatus = !status || booking.status === status;
      return (matchesName || matchesEmail) && matchesCommittee && matchesDate && matchesStatus;
    })
    .sort((first, second) => {
      if (interviewFilters.sort === "oldest") {
        return new Date(first.booked_at) - new Date(second.booked_at);
      }

      if (interviewFilters.sort === "upcoming") {
        const firstSlot = interviewSlots.find((slot) => slot.id === first.slot_id);
        const secondSlot = interviewSlots.find((slot) => slot.id === second.slot_id);
        const firstDate = firstSlot ? new Date(`${firstSlot.interview_date}T00:00:00`) : new Date(0);
        const secondDate = secondSlot ? new Date(`${secondSlot.interview_date}T00:00:00`) : new Date(0);
        return firstDate - secondDate;
      }

      return new Date(second.booked_at) - new Date(first.booked_at);
    });
}

function attachInterviewHandlers() {
  if (interviewHandlersAttached) {
    return;
  }

  interviewHandlersAttached = true;

  const addSlotBtn = document.getElementById("addInterviewSlotBtn");
  if (addSlotBtn) {
    addSlotBtn.addEventListener("click", () => openInterviewSlotModal());
  }

  const saveSlotBtn = document.getElementById("saveInterviewSlotBtn");
  if (saveSlotBtn) {
    saveSlotBtn.addEventListener("click", saveInterviewSlot);
  }

  const searchInput = document.getElementById("interviewSearch");
  const dateInput = document.getElementById("interviewDateFilter");
  const committeeInput = document.getElementById("interviewCommitteeFilter");
  const statusInput = document.getElementById("interviewStatusFilter");
  const sortInput = document.getElementById("interviewSort");

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      interviewFilters.search = event.target.value;
      renderInterviewBookings();
    });
  }

  if (dateInput) {
    dateInput.addEventListener("change", (event) => {
      interviewFilters.date = event.target.value;
      renderInterviewBookings();
    });
  }

  if (committeeInput) {
    committeeInput.addEventListener("change", (event) => {
      interviewFilters.committee = event.target.value;
      renderInterviewBookings();
    });
  }

  if (statusInput) {
    statusInput.addEventListener("change", (event) => {
      interviewFilters.status = event.target.value;
      renderInterviewBookings();
    });
  }

  if (sortInput) {
    sortInput.addEventListener("change", (event) => {
      interviewFilters.sort = event.target.value;
      renderInterviewBookings();
    });
  }
}

function openInterviewSlotModal(slotId = null) {
  const modal = document.getElementById("interviewSlotModal");
  if (!modal) return;

  const dateInput = document.getElementById("interviewSlotDate");
  const committeeInput = document.getElementById("interviewSlotCommittee");
  const startInput = document.getElementById("interviewSlotStartTime");
  const endInput = document.getElementById("interviewSlotEndTime");
  const title = document.getElementById("interviewSlotModalTitle");

  selectedInterviewSlot = slotId ? interviewSlots.find((slot) => slot.id === slotId) || null : null;
  interviewEditMode = Boolean(selectedInterviewSlot);

  if (selectedInterviewSlot && selectedInterviewSlot.status !== "available") {
    showToast("Only available interview slots can be edited.", "error");
    return;
  }

  if (title) {
    title.textContent = interviewEditMode ? "Edit Interview Slot" : "Create Interview Slot";
  }

  if (dateInput) dateInput.value = selectedInterviewSlot?.interview_date || new Date().toISOString().split("T")[0];
  if (committeeInput) committeeInput.value = selectedInterviewSlot?.committee || "";
  if (startInput) startInput.value = selectedInterviewSlot?.start_time || "09:00";
  if (endInput) endInput.value = selectedInterviewSlot?.end_time || "09:30";

  openModal("interviewSlotModal");
}

async function saveInterviewSlot() {
  if (interviewSaveInProgress) {
    return;
  }

  interviewSaveInProgress = true;

  const saveSlotBtn = document.getElementById("saveInterviewSlotBtn");
  if (saveSlotBtn) {
    saveSlotBtn.disabled = true;
    saveSlotBtn.textContent = "Saving...";
  }

  const date = document.getElementById("interviewSlotDate")?.value;
  const committee = document.getElementById("interviewSlotCommittee")?.value;
  const startTime = document.getElementById("interviewSlotStartTime")?.value;
  const endTime = document.getElementById("interviewSlotEndTime")?.value;

  if (!date || !committee || !startTime || !endTime) {
    interviewSaveInProgress = false;
    if (saveSlotBtn) {
      saveSlotBtn.disabled = false;
      saveSlotBtn.textContent = "Save Slot";
    }
    showToast("Committee, date, start time, and end time are required.", "error");
    return;
  }

  if (startTime >= endTime) {
    showToast("End time must be after start time.", "error");
    return;
  }

  const existingSlot = await interviewManagementAPI.getSlotByDateAndStart(date, startTime, committee, selectedInterviewSlot?.id);
  if (existingSlot) {
    interviewSaveInProgress = false;
    if (saveSlotBtn) {
      saveSlotBtn.disabled = false;
      saveSlotBtn.textContent = "Save Slot";
    }
    showToast("A slot with this date and start time already exists for the selected committee.", "error");
    return;
  }

  try {
    const payload = {
      interview_date: date,
      committee,
      start_time: startTime,
      end_time: endTime,
      status: "available"
    };

    if (interviewEditMode && selectedInterviewSlot) {
      await interviewManagementAPI.updateSlot(selectedInterviewSlot.id, payload);
      showToast("Interview slot updated successfully.", "success");
    } else {
      await interviewManagementAPI.createSlot(payload);
      showToast("Interview slot created successfully.", "success");
    }

    closeModal("interviewSlotModal");
    await loadInterviewData();
    renderInterviewStats();
    renderInterviewSlots();
    renderInterviewBookings();
  } catch (error) {
    console.error("Failed to save slot:", error);
    showToast("Failed to save interview slot.", "error");
  } finally {
    interviewSaveInProgress = false;
    if (saveSlotBtn) {
      saveSlotBtn.disabled = false;
      saveSlotBtn.textContent = "Save Slot";
    }
  }
}

async function deleteInterviewSlot(slotId) {
  if (!window.confirm("Delete this interview slot?")) {
    return;
  }

  try {
    const result = await interviewManagementAPI.deleteSlot(slotId);

    if (result?.action === "cancelled") {
      showToast("Slot cancelled because it has an existing booking.", "error");
    } else {
      showToast("Interview slot deleted successfully.", "success");
    }

    await loadInterviewData();
    renderInterviewStats();
    renderInterviewSlots();
    renderInterviewBookings();
  } catch (error) {
    console.error("Failed to delete slot:", error);
    showToast("Failed to delete interview slot.", "error");
  }
}

async function cancelInterviewBooking(bookingId) {
  const confirmed = window.confirm("Are you sure you want to cancel this booking?");
  if (!confirmed) {
    return;
  }

  const cancelButton = document.querySelector(`[data-booking-cancel-id="${bookingId}"]`);
  if (cancelButton) {
    cancelButton.disabled = true;
    cancelButton.textContent = "Cancelling...";
  }

  try {
    const result = await interviewManagementAPI.cancelBooking(bookingId);
    console.log("Booking cancelled successfully", result);
    showToast("Booking cancelled successfully. The interview slot is available again.", "success");
    await loadInterviewData();
    renderInterviewStats();
    renderInterviewSlots();
    renderInterviewBookings();
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    showToast("Failed to cancel booking.", "error");
  } finally {
    if (cancelButton) {
      cancelButton.disabled = false;
      cancelButton.textContent = "Cancel Booking";
    }
  }
}

async function updateInterviewBookingStatus(bookingId, status) {
  try {
    await interviewManagementAPI.updateBookingStatus(bookingId, status);
    showToast(`Booking marked as ${status.replace(/_/g, " ")}.`, "success");
    await loadInterviewData();
    renderInterviewStats();
    renderInterviewSlots();
    renderInterviewBookings();
  } catch (error) {
    console.error("Failed to update booking status:", error);
    showToast("Failed to update booking status.", "error");
  }
}

function showInterviewBookingDetails(bookingId) {
  const booking = interviewBookings.find((item) => item.id === bookingId);
  if (!booking) return;

  const slot = interviewSlots.find((item) => item.id === booking.slot_id);
  const details = document.getElementById("interviewBookingDetailsContent");
  if (!details) return;

  details.innerHTML = `
    <div class="field">
      <label>Applicant</label>
      <div>${booking.applicant_name || "—"}</div>
    </div>
    <div class="field">
      <label>Email</label>
      <div>${booking.applicant_email || "—"}</div>
    </div>
    <div class="field">
      <label>Phone</label>
      <div>${booking.applicant_phone || "—"}</div>
    </div>
    <div class="field">
      <label>Committee</label>
      <div>${slot ? formatCommitteeLabel(slot.committee) : "—"}</div>
    </div>
    <div class="field">
      <label>Date</label>
      <div>${slot ? formatAdminDate(slot.interview_date) : "—"}</div>
    </div>
    <div class="field">
      <label>Time</label>
      <div>${slot ? `${formatAdminTime(slot.start_time)} — ${formatAdminTime(slot.end_time)}` : "—"}</div>
    </div>
    <div class="field">
      <label>Status</label>
      <div>${safeStatusLabel(booking.status)}</div>
    </div>
    <div class="field full-width">
      <label>Notes</label>
      <div>${booking.notes || "No notes provided."}</div>
    </div>
  `;

  openModal("interviewBookingDetailsModal");
}

window.openInterviewSlotModal = openInterviewSlotModal;
window.saveInterviewSlot = saveInterviewSlot;
window.initInterviewBookingsUI = initInterviewBookingsUI;

export { initInterviewBookingsUI, openInterviewSlotModal, saveInterviewSlot };
