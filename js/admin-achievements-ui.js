// Admin Achievements UI Module
// Handles rendering and interaction for achievements management

let achievementsList = [];
let selectedAchievement = null;
let isEditMode = false;

// Ensure achievementsAPI is defined
if (typeof achievementsAPI === 'undefined') {
  console.error("achievementsAPI not defined - make sure admin-achievements-api.js is loaded");
}

async function initAchievementsUI() {
  try {
    await loadAchievements();
    attachAchievementEventListeners();
  } catch (error) {
    console.error("Error initializing achievements UI:", error);
    showToast("Error loading achievements", "error");
  }
}

async function loadAchievements() {
  try {
    achievementsList = await achievementsAPI.getAll();
    renderAchievementsGrid();
  } catch (error) {
    console.error("Failed to load achievements:", error);
    showToast("Failed to load achievements", "error");
  }
}

function renderAchievementsGrid() {
  const container = document.getElementById("achievementsGrid");
  if (!container) return;

  if (achievementsList.length === 0) {
    container.innerHTML = `<div class="empty-state">No achievements yet. Create your first one!</div>`;
    return;
  }

  container.innerHTML = achievementsList
    .map(achievement => `
      <div class="achievement-card" data-id="${achievement.id}">
        ${achievement.image_url ? `<div class="achievement-thumb"><img src="${achievement.image_url}" alt="${achievement.title}"></div>` : `<div class="achievement-thumb placeholder">📋</div>`}
        <div class="achievement-body">
          <div class="achievement-header">
            <h4>${achievement.title}</h4>
            ${achievement.featured ? `<span class="badge-featured">⭐ Featured</span>` : ""}
          </div>
          <p class="achievement-desc">${achievement.description || "No description"}</p>
          <div class="achievement-date">${formatDate(achievement.event_date)}</div>
          <div class="achievement-actions">
            <button class="btn-small btn-edit" data-id="${achievement.id}">Edit</button>
            <button class="btn-small btn-delete" data-id="${achievement.id}">Delete</button>
            <button class="btn-small ${achievement.featured ? 'btn-unstar' : 'btn-star'}" data-id="${achievement.id}">
              ${achievement.featured ? 'Unstar' : 'Star'}
            </button>
          </div>
        </div>
      </div>
    `)
    .join("");

  attachAchievementEventListeners();
}

function attachAchievementEventListeners() {
  // Edit buttons
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      selectedAchievement = achievementsList.find(a => a.id === id);
      isEditMode = true;
      openAchievementModal();
    });
  });

  // Delete buttons
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Delete this achievement?")) {
        await deleteAchievement(id);
      }
    });
  });

  // Star buttons
  document.querySelectorAll(".btn-star, .btn-unstar").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const achievement = achievementsList.find(a => a.id === id);
      await toggleAchievementFeatured(id, !achievement.featured);
    });
  });
}

function openAchievementModal() {
  try {
    const modal = document.getElementById("achievementModal");
    if (!modal) {
      console.error("Achievement modal element not found in DOM");
      return;
    }

    const title = modal.querySelector("h3");
    if (!title) {
      console.error("Modal title element not found");
      return;
    }

    const titleInput = modal.querySelector("#achievementTitle");
    const descInput = modal.querySelector("#achievementDesc");
    const dateInput = modal.querySelector("#achievementDate");
    const categoryInput = modal.querySelector("#achievementCategory");
    const orderInput = modal.querySelector("#achievementDisplayOrder");
    const featuredInput = modal.querySelector("#achievementFeatured");
    const imagePreview = modal.querySelector("#achievementImagePreview");
    const imageInput = document.querySelector("#achievementImageInput");

    if (!titleInput || !descInput || !dateInput || !categoryInput || !orderInput || !featuredInput || !imagePreview) {
      console.error("One or more form fields not found in achievement modal");
      return;
    }

    if (isEditMode) {
      title.textContent = "Edit Achievement";
      titleInput.value = selectedAchievement.title;
      descInput.value = selectedAchievement.description || "";
      dateInput.value = selectedAchievement.event_date;
      categoryInput.value = selectedAchievement.category || "";
      orderInput.value = selectedAchievement.display_order || 0;
      featuredInput.checked = selectedAchievement.featured || false;
      imagePreview.innerHTML = selectedAchievement.image_url
        ? `<img src="${selectedAchievement.image_url}" alt="Preview">`
        : "No image";
    } else {
      title.textContent = "New Achievement";
      titleInput.value = "";
      descInput.value = "";
      dateInput.value = new Date().toISOString().split("T")[0];
      categoryInput.value = "";
      orderInput.value = achievementsList.length;
      featuredInput.checked = false;
      imagePreview.innerHTML = "No image";
      if (imageInput) {
        imageInput.dataset.url = "";
      }
    }

    modal.classList.add("active");
  } catch (error) {
    console.error("Error in openAchievementModal:", error);
  }
}

window.openAchievementModal = openAchievementModal;

function closeAchievementModal() {
  try {
    const modal = document.getElementById("achievementModal");
    if (!modal) {
      console.error("Achievement modal element not found");
      return;
    }
    modal.classList.remove("active");
    isEditMode = false;
    selectedAchievement = null;
  } catch (error) {
    console.error("Error in closeAchievementModal:", error);
  }
}

window.closeAchievementModal = closeAchievementModal;

function formatSupabaseError(error) {
  if (!error) return "Unknown Supabase error";
  const details = [];
  if (error.code) details.push(`code: ${error.code}`);
  if (error.message) details.push(`message: ${error.message}`);
  if (error.details) details.push(`details: ${error.details}`);
  if (error.hint) details.push(`hint: ${error.hint}`);
  return details.join(" | ") || JSON.stringify(error);
}

async function saveAchievement() {
  const title = document.querySelector("#achievementTitle").value.trim();
  const description = document.querySelector("#achievementDesc").value.trim();
  const eventDate = document.querySelector("#achievementDate").value;
  const category = document.querySelector("#achievementCategory").value.trim();
  const displayOrder = parseInt(document.querySelector("#achievementDisplayOrder").value) || 0;
  const featured = document.querySelector("#achievementFeatured").checked;
  const imageUrl = document.querySelector("#achievementImageInput").dataset.url || selectedAchievement?.image_url || null;

  if (!title || !eventDate) {
    showToast("Title and date are required", "error");
    return;
  }

  try {
    if (isEditMode) {
      await achievementsAPI.update(selectedAchievement.id, {
        title,
        description,
        event_date: eventDate,
        category,
        display_order: displayOrder,
        featured,
        image_url: imageUrl
      });
      showToast("Achievement updated successfully", "success");
    } else {
      await achievementsAPI.create({
        title,
        description,
        event_date: eventDate,
        category,
        display_order: displayOrder,
        featured,
        image_url: imageUrl
      });
      showToast("Achievement created successfully", "success");
    }
    closeAchievementModal();
    await loadAchievements();
  } catch (error) {
    const message = formatSupabaseError(error);
    console.error("Failed to save achievement:", message, error);
    showToast(message, "error");
  }
}

async function deleteAchievement(id) {
  try {
    console.log("Deleting achievement:", id);
    await achievementsAPI.delete(id);
    showToast("Achievement deleted successfully", "success");
    await loadAchievements();
  } catch (error) {
    const message = formatSupabaseError(error);
    console.error("Failed to delete achievement:", message, error);
    showToast(message, "error");
  }
}

async function toggleAchievementFeatured(id, featured) {
  try {
    await achievementsAPI.toggleFeatured(id, featured);
    showToast(featured ? "Achievement featured" : "Achievement unfeatured", "success");
    await loadAchievements();
  } catch (error) {
    console.error("Failed to toggle featured:", error);
    showToast("Failed to update achievement", "error");
  }
}

async function uploadAchievementImage(file) {
  if (!file) return;

  try {
    const url = await achievementsAPI.uploadImage(file);
    document.querySelector("#achievementImageInput").dataset.url = url;
    document.querySelector("#achievementImagePreview").innerHTML = `<img src="${url}" alt="Preview">`;
    showToast("Image uploaded successfully", "success");
  } catch (error) {
    const message = formatSupabaseError(error);
    console.error("Failed to upload image:", message, error);
    showToast(message, "error");
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

window.saveAchievement = saveAchievement;
window.deleteAchievement = deleteAchievement;
window.toggleAchievementFeatured = toggleAchievementFeatured;
window.uploadAchievementImage = uploadAchievementImage;
window.initAchievementsUI = initAchievementsUI;
