// Admin Events UI Module
// Handles rendering and interaction for events management

import { eventsAPI } from "./admin-events-api.js";

let eventsList = [];
let selectedEvent = null;
let isEditMode = false;

async function initEventsUI() {
  try {
    await loadEvents();
    attachEventEventListeners();
  } catch (error) {
    console.error("Error initializing events UI:", error);
    showToast("Error loading events", "error");
  }
}

async function loadEvents() {
  try {
    eventsList = await eventsAPI.getAll();
    renderEventsGrid();
  } catch (error) {
    console.error("Failed to load events:", error);
    showToast("Failed to load events", "error");
  }
}

function renderEventsGrid() {
  const container = document.getElementById("eventsGrid");
  if (!container) return;

  if (eventsList.length === 0) {
    container.innerHTML = `<div class="empty-state">No events yet. Create your first one!</div>`;
    return;
  }

  container.innerHTML = eventsList
    .map(event => `
      <div class="event-card" data-id="${event.id}">
        ${event.image_url ? `<div class="event-thumb"><img src="${event.image_url}" alt="${event.title}"></div>` : `<div class="event-thumb placeholder">📅</div>`}
        <div class="event-body">
          <div class="event-header">
            <h4>${event.title}</h4>
            ${event.featured ? `<span class="badge-featured">⭐ Featured</span>` : ""}
          </div>
          <p class="event-desc">${event.description || "No description"}</p>
          <div class="event-meta">
            <div>📅 ${formatDate(event.event_date)}</div>
            ${event.event_time ? `<div>⏰ ${event.event_time}</div>` : ""}
            ${event.location ? `<div>📍 ${event.location}</div>` : ""}
          </div>
          <div class="event-actions">
            <button class="btn-small btn-edit" data-id="${event.id}">Edit</button>
            <button class="btn-small btn-delete" data-id="${event.id}">Delete</button>
            <button class="btn-small ${event.featured ? 'btn-unstar' : 'btn-star'}" data-id="${event.id}">
              ${event.featured ? 'Unstar' : 'Star'}
            </button>
            ${event.registration_url ? `<a href="${event.registration_url}" target="_blank" class="btn-small btn-link">Register</a>` : ""}
          </div>
        </div>
      </div>
    `)
    .join("");

  attachEventEventListeners();
}

function attachEventEventListeners() {
  // Edit buttons
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      selectedEvent = eventsList.find(item => item.id === id);
      isEditMode = true;
      openEventModal();
    });
  });

  // Delete buttons
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Delete this event?")) {
        await deleteEvent(id);
      }
    });
  });

  // Star buttons
  document.querySelectorAll(".btn-star, .btn-unstar").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const eventItem = eventsList.find(item => item.id === id);
      await toggleEventFeatured(id, !eventItem.featured);
    });
  });
}

export function openEventModal(event = null) {
  try {
    const modal = document.getElementById("eventModal");
    if (!modal) {
      console.error("Event modal element not found in DOM");
      return;
    }

    const title = modal.querySelector("h3");
    if (!title) {
      console.error("Modal title element not found");
      return;
    }

    const titleInput = modal.querySelector("#eventTitle");
    const descInput = modal.querySelector("#eventDesc");
    const dateInput = modal.querySelector("#eventDate");
    const timeInput = modal.querySelector("#eventTime");
    const locationInput = modal.querySelector("#eventLocation");
    const registrationInput = modal.querySelector("#eventRegistrationLink");
    const orderInput = modal.querySelector("#eventDisplayOrder");
    const featuredInput = modal.querySelector("#eventFeatured");
    const visibleInput = modal.querySelector("#eventVisible");
    const imagePreview = modal.querySelector("#eventImagePreview");
    const imageInput = document.querySelector("#eventImageInput");

    if (!titleInput || !descInput || !dateInput || !timeInput || !locationInput || !registrationInput || !orderInput || !featuredInput || !visibleInput || !imagePreview) {
      console.error("One or more form fields not found in event modal");
      return;
    }

    if (isEditMode) {
      title.textContent = "Edit Event";
      titleInput.value = selectedEvent.title;
      descInput.value = selectedEvent.description || "";
      dateInput.value = selectedEvent.event_date || "";
      timeInput.value = selectedEvent.event_time || "";
      locationInput.value = selectedEvent.location || "";
      registrationInput.value = selectedEvent.registration_url || "";
      orderInput.value = selectedEvent.display_order || 0;
      featuredInput.checked = selectedEvent.featured || false;
      visibleInput.checked = selectedEvent.visible !== false;
      imagePreview.innerHTML = selectedEvent.image_url
        ? `<img src="${selectedEvent.image_url}" alt="Preview">`
        : "No image";
    } else {
      title.textContent = "New Event";
      titleInput.value = "";
      descInput.value = "";
      dateInput.value = new Date().toISOString().split("T")[0];
      timeInput.value = "";
      locationInput.value = "";
      registrationInput.value = "";
      orderInput.value = eventsList.length;
      featuredInput.checked = false;
      visibleInput.checked = true;
      imagePreview.innerHTML = "No image";
      if (imageInput) {
        imageInput.dataset.url = "";
      }
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    console.log("Event modal opened successfully");
  } catch (error) {
    console.error("Error in openEventModal:", error);
  }
}

window.openEventModal = openEventModal;

export function closeEventModal() {

  try {
    const modal = document.getElementById("eventModal");
    if (!modal) {
      console.error("Event modal element not found");
      return;
    }
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    isEditMode = false;
    selectedEvent = null;
  } catch (error) {
    console.error("Error in closeEventModal:", error);
  }
}

window.closeEventModal = closeEventModal;

export async function saveEvent() {
  const title = document.querySelector("#eventTitle").value.trim();
  const description = document.querySelector("#eventDesc").value.trim();
  const eventDate = document.querySelector("#eventDate").value;
  const eventTime = document.querySelector("#eventTime").value || null;
  const location = document.querySelector("#eventLocation").value.trim() || null;
  const registrationUrl = document.querySelector("#eventRegistrationLink").value.trim() || null;
  const displayOrder = parseInt(document.querySelector("#eventDisplayOrder").value) || 0;
  const featured = document.querySelector("#eventFeatured").checked;
  const visibleInput = document.querySelector("#eventVisible");
  const visible = visibleInput ? visibleInput.checked : true;
  const imageUrl = document.querySelector("#eventImageInput").dataset.url || selectedEvent?.image_url || null;

  if (!title || !eventDate) {
    showToast("Title and date are required", "error");
    return;
  }

  try {
    const payload = {
      title,
      description,
      event_date: eventDate,
      event_time: eventTime,
      location,
      image_url: imageUrl,
      registration_url: registrationUrl,
      featured,
      visible,
      display_order: displayOrder
    };

    if (isEditMode) {
      await eventsAPI.update(selectedEvent.id, payload);
      showToast("Event updated successfully", "success");
    } else {
      await eventsAPI.create(payload);
      showToast("Event created successfully", "success");
    }
    closeEventModal();
    await loadEvents();
  } catch (error) {
    console.error("Failed to save event:", error);
    showToast("Failed to save event", "error");
  }
}

async function deleteEvent(id) {
  try {
    await eventsAPI.delete(id);
    showToast("Event deleted successfully", "success");
    await loadEvents();
  } catch (error) {
    console.error("Failed to delete event:", error);
    showToast("Failed to delete event", "error");
  }
}

async function toggleEventFeatured(id, featured) {
  try {
    await eventsAPI.toggleFeatured(id, featured);
    showToast(featured ? "Event featured" : "Event unfeatured", "success");
    await loadEvents();
  } catch (error) {
    console.error("Failed to toggle featured:", error);
    showToast("Failed to update event", "error");
  }
}

async function uploadEventImage(file) {
  if (!file) return;

  try {
    const url = await eventsAPI.uploadImage(file);
    document.querySelector("#eventImageInput").dataset.url = url;
    document.querySelector("#eventImagePreview").innerHTML = `<img src="${url}" alt="Preview">`;
    showToast("Image uploaded successfully", "success");
  } catch (error) {
    console.error("Failed to upload image:", error);
    showToast("Failed to upload image", "error");
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

window.saveEvent = saveEvent;
window.deleteEvent = deleteEvent;
window.toggleEventFeatured = toggleEventFeatured;
window.uploadEventImage = uploadEventImage;
window.initEventsUI = initEventsUI;

export { initEventsUI };
