// Admin Gallery UI Module
// Handles gallery CRUD, uploads, ordering, feature toggles, and search

let galleryItems = [];
let selectedGalleryItem = null;
let isEditMode = false;
let galleryFormImageUrl = null;

async function initGalleryUI() {
  try {
    const searchInput = document.getElementById("gallerySearch");
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.addEventListener("input", renderGalleryGrid);
      searchInput.dataset.bound = "true";
    }

    await loadGalleryItems();
    attachGalleryEventListeners();
  } catch (error) {
    console.error("Error initializing gallery UI:", error);
    showToast("Error loading gallery", "error");
  }
}

async function loadGalleryItems() {
  try {
    galleryItems = await galleryAPI.getAll();
    renderGalleryGrid();
  } catch (error) {
    console.error("Failed to load gallery items:", error);
    showToast("Failed to load gallery", "error");
  }
}

function renderGalleryGrid() {
  const container = document.getElementById("galleryGrid");
  if (!container) return;

  const searchValue = (document.getElementById("gallerySearch")?.value || "").trim().toLowerCase();
  const filtered = galleryItems.filter((item) => {
    if (!searchValue) return true;
    return `${item.title || ""} ${item.album || ""} ${item.description || ""}`.toLowerCase().includes(searchValue);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No gallery items yet. Upload your first image.</div>`;
    return;
  }

  container.innerHTML = filtered
    .map((item) => `
      <div class="gallery-card" data-id="${item.id}">
        <div class="gallery-thumb">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.title || "Gallery image"}">` : `<div class="gallery-placeholder">🖼</div>`}
        </div>
        <div class="gallery-body">
          <div class="gallery-header">
            <h4>${item.title || "Untitled"}</h4>
            ${item.featured ? `<span class="badge-featured">⭐ Featured</span>` : ""}
          </div>
          <p class="gallery-desc">${item.description || "No description"}</p>
          <div class="gallery-meta">
            ${item.album ? `<div>📁 ${item.album}</div>` : ""}
          </div>
          <div class="gallery-actions">
            <button class="btn-small btn-move-up" data-id="${item.id}" type="button">↑ Up</button>
            <button class="btn-small btn-move-down" data-id="${item.id}" type="button">↓ Down</button>
            <button class="btn-small btn-edit" data-id="${item.id}" type="button">Edit</button>
            <button class="btn-small btn-delete" data-id="${item.id}" type="button">Delete</button>
            <button class="btn-small ${item.featured ? "btn-unstar" : "btn-star"}" data-id="${item.id}" type="button">
              ${item.featured ? "Unstar" : "Star"}
            </button>
          </div>
        </div>
      </div>
    `)
    .join("");

  attachGalleryEventListeners();
}

function attachGalleryEventListeners() {
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      selectedGalleryItem = galleryItems.find((item) => item.id === id);
      isEditMode = true;
      openGalleryModal();
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm("Delete this gallery image?")) {
        await deleteGalleryItem(id);
      }
    });
  });

  document.querySelectorAll(".btn-star, .btn-unstar").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const item = galleryItems.find((entry) => entry.id === id);
      await toggleGalleryFeatured(id, !item.featured);
    });
  });

  document.querySelectorAll(".btn-move-up, .btn-move-down").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const index = galleryItems.findIndex((entry) => entry.id === id);
      if (index === -1) return;
      const targetIndex = e.currentTarget.classList.contains("btn-move-up") ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= galleryItems.length) return;
      const reordered = [...galleryItems];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      await galleryAPI.updateOrder(reordered.map((item) => item.id));
      galleryItems = reordered;
      renderGalleryGrid();
    });
  });
}

function openGalleryModal(item = null) {
  const modal = document.getElementById("galleryModal");
  if (!modal) return;

  const title = modal.querySelector("h3");
  const titleInput = modal.querySelector("#galleryTitle");
  const descInput = modal.querySelector("#galleryDescription");
  const albumInput = modal.querySelector("#galleryAlbum");
  const orderInput = modal.querySelector("#galleryDisplayOrder");
  const featuredInput = modal.querySelector("#galleryFeatured");
  const preview = modal.querySelector("#galleryImagePreview");
  const imageInput = modal.querySelector("#galleryImageInput");

  if (!titleInput || !descInput || !albumInput || !orderInput || !featuredInput || !preview || !imageInput) return;

  if (isEditMode && selectedGalleryItem) {
    title.textContent = "Edit Gallery Image";
    titleInput.value = selectedGalleryItem.title || "";
    descInput.value = selectedGalleryItem.description || "";
    albumInput.value = selectedGalleryItem.album || "";
    orderInput.value = selectedGalleryItem.display_order || 0;
    featuredInput.checked = selectedGalleryItem.featured || false;
    galleryFormImageUrl = selectedGalleryItem.image_url || null;
    preview.innerHTML = galleryFormImageUrl ? `<img src="${galleryFormImageUrl}" alt="Preview">` : "No image";
    imageInput.dataset.url = galleryFormImageUrl || "";
    imageInput.value = "";
  } else {
    title.textContent = "New Gallery Image";
    titleInput.value = "";
    descInput.value = "";
    albumInput.value = "";
    orderInput.value = galleryItems.length;
    featuredInput.checked = false;
    galleryFormImageUrl = null;
    preview.innerHTML = "No image";
    imageInput.dataset.url = "";
    imageInput.value = "";
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function resetGalleryForm() {
  const modal = document.getElementById("galleryModal");
  if (!modal) return;

  const titleInput = modal.querySelector("#galleryTitle");
  const descInput = modal.querySelector("#galleryDescription");
  const albumInput = modal.querySelector("#galleryAlbum");
  const orderInput = modal.querySelector("#galleryDisplayOrder");
  const featuredInput = modal.querySelector("#galleryFeatured");
  const preview = modal.querySelector("#galleryImagePreview");
  const imageInput = modal.querySelector("#galleryImageInput");

  if (titleInput) titleInput.value = "";
  if (descInput) descInput.value = "";
  if (albumInput) albumInput.value = "";
  if (orderInput) orderInput.value = "";
  if (featuredInput) featuredInput.checked = false;
  if (preview) preview.innerHTML = "No image";
  if (imageInput) {
    imageInput.value = "";
    imageInput.dataset.url = "";
  }

  galleryFormImageUrl = null;
}

function closeGalleryModal() {
  const modal = document.getElementById("galleryModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  resetGalleryForm();
  isEditMode = false;
  selectedGalleryItem = null;
}

async function saveGalleryItem() {
  const title = document.querySelector("#galleryTitle").value.trim();
  const description = document.querySelector("#galleryDescription").value.trim();
  const album = document.querySelector("#galleryAlbum").value.trim();
  const displayOrder = parseInt(document.querySelector("#galleryDisplayOrder").value) || 0;
  const featured = document.querySelector("#galleryFeatured").checked;
  const imageInput = document.querySelector("#galleryImageInput");
  const imageUrl = galleryFormImageUrl || imageInput?.dataset.url || selectedGalleryItem?.image_url || null;

  if (!title) {
    showToast("Title is required", "error");
    return;
  }

  if (!imageUrl) {
    showToast("Please upload an image first.", "error");
    return;
  }

  const payload = {
    title,
    description: description || null,
    album: album || null,
    image_url: imageUrl,
    featured,
    display_order: displayOrder
  };

  const galleryData = { ...payload };
  console.log("Gallery item:", galleryData);

  try {
    if (isEditMode) {
      await galleryAPI.update(selectedGalleryItem.id, payload);
      showToast("Gallery image updated", "success");
    } else {
      await galleryAPI.create(payload);
      showToast("Gallery image created", "success");
    }
    closeGalleryModal();
    await loadGalleryItems();
    window.loadWebsiteGallery?.();
  } catch (error) {
    console.error("Failed to save gallery item:", error);
    showToast("Failed to save gallery item", "error");
  }
}

async function deleteGalleryItem(id) {
  try {
    await galleryAPI.delete(id);
    showToast("Gallery image deleted", "success");
    await loadGalleryItems();
  } catch (error) {
    console.error("Failed to delete gallery item:", error);
    showToast("Failed to delete gallery item", "error");
  }
}

async function toggleGalleryFeatured(id, featured) {
  try {
    await galleryAPI.toggleFeatured(id, featured);
    showToast(featured ? "Image featured" : "Image unfeatured", "success");
    await loadGalleryItems();
    window.loadWebsiteGallery?.();
  } catch (error) {
    console.error("Failed to toggle featured:", error);
    showToast("Failed to update gallery image", "error");
  }
}

async function uploadGalleryImage(file) {
  if (!file) return;
  try {
    const url = await galleryAPI.uploadImage(file);
    const imageInput = document.querySelector("#galleryImageInput");
    const preview = document.querySelector("#galleryImagePreview");

    galleryFormImageUrl = url;
    if (imageInput) {
      imageInput.dataset.url = url;
    }
    if (preview) {
      preview.innerHTML = `<img src="${url}" alt="Preview">`;
    }
    showToast("Image uploaded successfully", "success");
  } catch (error) {
    console.error("Failed to upload image:", error);
    showToast("Failed to upload image", "error");
  }
}

window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.saveGalleryItem = saveGalleryItem;
window.deleteGalleryItem = deleteGalleryItem;
window.toggleGalleryFeatured = toggleGalleryFeatured;
window.uploadGalleryImage = uploadGalleryImage;
window.initGalleryUI = initGalleryUI;

export { initGalleryUI, openGalleryModal, closeGalleryModal, saveGalleryItem };
