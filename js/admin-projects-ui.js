import { projectsAPI } from "./projects-api.js";

let projectsList = [];
let filteredProjects = [];
let selectedProject = null;
let isEditMode = false;
let projectFilters = {
  search: "",
  status: "",
  category: "",
  sort: "display_order"
};

async function initProjectsUI() {
  try {
    await loadProjects();
    attachProjectEventListeners();
  } catch (error) {
    console.error("Error initializing projects UI:", error);
    showToast("Error loading projects", "error");
  }
}

async function loadProjects() {
  try {
    projectsList = await projectsAPI.getAll();
    populateProjectCategoryFilter();
    applyProjectFiltersAndSort();
    renderProjectsGrid();
  } catch (error) {
    console.error("Failed to load projects:", error);
    showToast("Failed to load projects", "error");
  }
}

function populateProjectCategoryFilter() {
  const select = document.getElementById("projectCategoryFilter");
  if (!select) return;

  const categories = [...new Set(projectsList.map(project => project.category).filter(Boolean))].sort();
  const currentValue = select.value;
  select.innerHTML = `<option value="">Filter by Category</option>${categories.map(category => `<option value="${category}">${category}</option>`).join("")}`;
  if (categories.includes(currentValue)) {
    select.value = currentValue;
  }
}

function attachProjectToolbarListeners() {
  const searchInput = document.getElementById("projectSearch");
  const statusFilter = document.getElementById("projectStatusFilter");
  const categoryFilter = document.getElementById("projectCategoryFilter");
  const sortSelect = document.getElementById("projectSort");

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      projectFilters.search = event.target.value.trim().toLowerCase();
      applyProjectFiltersAndSort();
      renderProjectsGrid();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (event) => {
      projectFilters.status = event.target.value;
      applyProjectFiltersAndSort();
      renderProjectsGrid();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", (event) => {
      projectFilters.category = event.target.value;
      applyProjectFiltersAndSort();
      renderProjectsGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (event) => {
      projectFilters.sort = event.target.value;
      applyProjectFiltersAndSort();
      renderProjectsGrid();
    });
  }
}

function applyProjectFiltersAndSort() {
  let nextProjects = [...projectsList];

  if (projectFilters.search) {
    nextProjects = nextProjects.filter(project =>
      [project.title, project.short_description, project.full_description, project.category, project.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(projectFilters.search)
    );
  }

  if (projectFilters.status) {
    nextProjects = nextProjects.filter(project => (project.status || "Planned") === projectFilters.status);
  }

  if (projectFilters.category) {
    nextProjects = nextProjects.filter(project => (project.category || "") === projectFilters.category);
  }

  if (projectFilters.sort === "featured") {
    nextProjects.sort((a, b) => Number(b.featured) - Number(a.featured) || (a.display_order || 0) - (b.display_order || 0));
  } else if (projectFilters.sort === "title") {
    nextProjects.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (projectFilters.sort === "progress") {
    nextProjects.sort((a, b) => (b.progress || 0) - (a.progress || 0));
  } else {
    nextProjects.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  filteredProjects = nextProjects;
}

function renderProjectsGrid() {
  const container = document.getElementById("projectsGrid");
  if (!container) return;

  if (filteredProjects.length === 0) {
    container.innerHTML = `<div class="empty-state">No projects yet. Create your first one!</div>`;
    return;
  }

  container.innerHTML = filteredProjects
    .map(project => `
      <div class="project-cms-card" data-id="${project.id}">
        <div class="project-cms-thumb">
          ${project.image_url ? `<img src="${project.image_url}" alt="${project.title}">` : `<div class="project-cms-placeholder">📁</div>`}
        </div>
        <div class="project-cms-body">
          <div class="project-cms-header">
            <div>
              <h4>${project.title}</h4>
              <div class="project-cms-meta">${project.category || "General"}</div>
            </div>
            ${project.featured ? `<span class="badge-featured">⭐ Featured</span>` : ""}
          </div>
          <span class="project-cms-status ${getProjectStatusClass(project.status)}">${project.status || "Planned"}</span>
          <div class="project-cms-progress">
            <div class="project-cms-progress-bar">
              <div style="width:${Math.max(0, Math.min(100, project.progress || 0))}%;"></div>
            </div>
            <span>${project.progress || 0}%</span>
          </div>
          <p class="project-cms-desc">${project.short_description || project.full_description || "No description"}</p>
          <div class="project-cms-actions">
            <button class="btn-small btn-edit" data-id="${project.id}">Edit</button>
            <button class="btn-small btn-delete" data-id="${project.id}">Delete</button>
            <button class="btn-small ${project.featured ? "btn-unstar" : "btn-star"}" data-id="${project.id}">${project.featured ? "Unfeature" : "Feature"}</button>
            <button class="btn-small btn-toggle-visible" data-id="${project.id}">${project.visible === false ? "Show" : "Hide"}</button>
            <button class="btn-small btn-move-up" data-id="${project.id}">↑</button>
            <button class="btn-small btn-move-down" data-id="${project.id}">↓</button>
          </div>
        </div>
      </div>
    `)
    .join("");

  attachProjectEventListeners();
}

function attachProjectEventListeners() {
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      selectedProject = projectsList.find(item => item.id === id);
      isEditMode = true;
      openProjectModal();
    });
  });

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Delete this project?")) {
        await deleteProject(id);
      }
    });
  });

  document.querySelectorAll(".btn-star, .btn-unstar").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const project = projectsList.find(item => item.id === id);
      await toggleProjectFeatured(id, !project.featured);
    });
  });

  document.querySelectorAll(".btn-toggle-visible").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const project = projectsList.find(item => item.id === id);
      await toggleProjectVisible(id, project.visible !== false);
    });
  });

  document.querySelectorAll(".btn-move-up").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await moveProjectOrder(id, "up");
    });
  });

  document.querySelectorAll(".btn-move-down").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await moveProjectOrder(id, "down");
    });
  });
}

function ensureProjectModalExists() {
  if (document.getElementById("projectModal")) return;

  const modalMarkup = `
    <div class="modal" id="projectModal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="projectModalTitle">New Project</h3>
          <button class="modal-close" data-modal-close="projectModal" type="button">×</button>
        </div>
        <div class="form-grid">
          <div class="field"><label for="projectName">Project Name</label><input id="projectName" type="text" placeholder="Project Name"></div>
          <div class="field"><label for="projectCategory">Category</label><input id="projectCategory" type="text" placeholder="e.g. Robotics, AI, Hardware"></div>
          <div class="field"><label for="projectStatus">Status</label><select id="projectStatus"><option value="Planned">Planned</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="Live">Live</option></select></div>
          <div class="field"><label for="projectProgress">Progress</label><input id="projectProgress" type="range" min="0" max="100" step="1" value="0"><div class="progress-label" id="projectProgressValue">0%</div></div>
          <div class="field full-width"><label for="projectShortDescription">Short Description</label><textarea id="projectShortDescription" placeholder="Short description..."></textarea></div>
          <div class="field full-width"><label for="projectFullDescription">Full Description</label><textarea id="projectFullDescription" placeholder="Full description..."></textarea></div>
          <div class="field"><label for="projectGithubUrl">GitHub URL</label><input id="projectGithubUrl" type="url" placeholder="https://github.com/..."></div>
          <div class="field"><label for="projectDemoUrl">Demo URL</label><input id="projectDemoUrl" type="url" placeholder="https://..."></div>
          <div class="field"><label for="projectDisplayOrder">Display Order</label><input id="projectDisplayOrder" type="number" placeholder="0" min="0"></div>
          <div class="field"><label for="projectFeatured"><input id="projectFeatured" type="checkbox" style="margin-right: 0.5rem;">Featured</label></div>
          <div class="field"><label for="projectVisible"><input id="projectVisible" type="checkbox" checked style="margin-right: 0.5rem;">Visible</label></div>
          <div class="field full-width"><label>Project Image</label><div class="image-dropzone" id="projectImageDropzone"><div class="image-preview-wrapper"><div id="projectImagePreview">No image</div></div><input id="projectImageInput" type="file" accept="image/*" hidden data-url=""></div></div>
        </div>
        <div class="confirm-actions">
          <button class="ghost-btn" data-modal-close="projectModal" type="button">Cancel</button>
          <button class="primary-btn" id="saveProjectBtn" type="button">Save Project</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalMarkup);
}

export function resetProjectForm() {
  const modal = document.getElementById("projectModal");
  if (!modal) return;

  const title = modal.querySelector("#projectModalTitle");
  const projectName = modal.querySelector("#projectName");
  const shortDescription = modal.querySelector("#projectShortDescription");
  const fullDescription = modal.querySelector("#projectFullDescription");
  const category = modal.querySelector("#projectCategory");
  const status = modal.querySelector("#projectStatus");
  const progress = modal.querySelector("#projectProgress");
  const progressValue = modal.querySelector("#projectProgressValue");
  const githubUrl = modal.querySelector("#projectGithubUrl");
  const demoUrl = modal.querySelector("#projectDemoUrl");
  const featured = modal.querySelector("#projectFeatured");
  const visible = modal.querySelector("#projectVisible");
  const order = modal.querySelector("#projectDisplayOrder");
  const imagePreview = modal.querySelector("#projectImagePreview");
  const imageInput = modal.querySelector("#projectImageInput");

  if (title) title.textContent = "New Project";
  if (projectName) projectName.value = "";
  if (shortDescription) shortDescription.value = "";
  if (fullDescription) fullDescription.value = "";
  if (category) category.value = "";
  if (status) status.value = "Planned";
  if (progress) progress.value = 0;
  if (progressValue) progressValue.textContent = "0%";
  if (githubUrl) githubUrl.value = "";
  if (demoUrl) demoUrl.value = "";
  if (featured) featured.checked = false;
  if (visible) visible.checked = true;
  if (order) order.value = projectsList.length;
  if (imagePreview) imagePreview.innerHTML = "No image";
  if (imageInput) imageInput.dataset.url = "";

  modal.querySelectorAll("input, textarea, select").forEach((field) => {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    field.setAttribute("aria-invalid", "false");
  });
}

export function fillProjectForm(project) {
  const modal = document.getElementById("projectModal");
  if (!modal) return;

  const title = modal.querySelector("#projectModalTitle");
  const projectName = modal.querySelector("#projectName");
  const shortDescription = modal.querySelector("#projectShortDescription");
  const fullDescription = modal.querySelector("#projectFullDescription");
  const category = modal.querySelector("#projectCategory");
  const status = modal.querySelector("#projectStatus");
  const progress = modal.querySelector("#projectProgress");
  const progressValue = modal.querySelector("#projectProgressValue");
  const githubUrl = modal.querySelector("#projectGithubUrl");
  const demoUrl = modal.querySelector("#projectDemoUrl");
  const featured = modal.querySelector("#projectFeatured");
  const visible = modal.querySelector("#projectVisible");
  const order = modal.querySelector("#projectDisplayOrder");
  const imagePreview = modal.querySelector("#projectImagePreview");

  if (title) title.textContent = "Edit Project";
  if (projectName) projectName.value = project?.title || "";
  if (shortDescription) shortDescription.value = project?.short_description || "";
  if (fullDescription) fullDescription.value = project?.full_description || "";
  if (category) category.value = project?.category || "";
  if (status) status.value = project?.status || "Planned";
  if (progress) progress.value = project?.progress || 0;
  if (progressValue) progressValue.textContent = `${project?.progress || 0}%`;
  if (githubUrl) githubUrl.value = project?.github_url || "";
  if (demoUrl) demoUrl.value = project?.demo_url || "";
  if (featured) featured.checked = project?.featured || false;
  if (visible) visible.checked = project?.visible !== false;
  if (order) order.value = project?.display_order || 0;
  if (imagePreview) imagePreview.innerHTML = project?.image_url ? `<img src="${project.image_url}" alt="Preview">` : "No image";
}

export function openProjectModal(project = null) {
  ensureProjectModalExists();
  const modal = document.getElementById("projectModal");
  if (!modal) {
    console.error("Project modal element not found");
    return;
  }

  const progress = modal.querySelector("#projectProgress");
  const progressValue = modal.querySelector("#projectProgressValue");
  const firstInput = modal.querySelector("#projectName");

  if (progress && !progress.dataset.bound) {
    progress.addEventListener("input", () => {
      if (progressValue) {
        progressValue.textContent = `${progress.value}%`;
      }
    });
    progress.dataset.bound = "true";
  }

  if (project) {
    selectedProject = project;
    isEditMode = true;
    fillProjectForm(selectedProject);
  } else {
    selectedProject = null;
    isEditMode = false;
    resetProjectForm();
  }

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50);
  }
  console.log("Project modal opened successfully");
}

window.openProjectModal = openProjectModal;

export function closeProjectModal() {
  const modal = document.getElementById("projectModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  isEditMode = false;
  selectedProject = null;
}

window.closeProjectModal = closeProjectModal;

function getProjectStatusClass(status) {
  const normalized = (status || "Planned").toLowerCase();
  if (normalized.includes("live") || normalized.includes("complete") || normalized.includes("done")) return "status-live";
  if (normalized.includes("research") || normalized.includes("planning") || normalized.includes("planned")) return "status-research";
  return "status-dev";
}

export async function saveProject() {
  const title = document.querySelector("#projectName").value.trim();
  const shortDescription = document.querySelector("#projectShortDescription").value.trim();
  const fullDescription = document.querySelector("#projectFullDescription").value.trim();
  const category = document.querySelector("#projectCategory").value.trim();
  const status = document.querySelector("#projectStatus").value.trim();
  const progress = parseInt(document.querySelector("#projectProgress").value, 10) || 0;
  const githubUrl = document.querySelector("#projectGithubUrl").value.trim() || null;
  const demoUrl = document.querySelector("#projectDemoUrl").value.trim() || null;
  const featured = document.querySelector("#projectFeatured").checked;
  const visible = document.querySelector("#projectVisible").checked;
  const displayOrder = parseInt(document.querySelector("#projectDisplayOrder").value, 10) || 0;
  const imageUrl = document.querySelector("#projectImageInput").dataset.url || selectedProject?.image_url || null;

  if (!title) {
    showToast("Project name is required", "error");
    return;
  }

  try {
    const payload = {
      title,
      short_description: shortDescription,
      full_description: fullDescription,
      image_url: imageUrl,
      category,
      status,
      progress,
      github_url: githubUrl,
      demo_url: demoUrl,
      featured,
      visible,
      display_order: displayOrder
    };

    if (isEditMode) {
      await projectsAPI.update(selectedProject.id, payload);
      showToast("Project updated successfully", "success");
    } else {
      await projectsAPI.create(payload);
      showToast("Project created successfully", "success");
    }

    closeProjectModal();
    notifyProjectsUpdated();
    await loadProjects();
  } catch (error) {
    console.error("Failed to save project:", error);
    showToast("Failed to save project", "error");
  }
}

async function deleteProject(id) {
  try {
    await projectsAPI.delete(id);
    showToast("Project deleted successfully", "success");
    notifyProjectsUpdated();
    await loadProjects();
  } catch (error) {
    console.error("Failed to delete project:", error);
    showToast("Failed to delete project", "error");
  }
}

async function toggleProjectFeatured(id, featured) {
  try {
    await projectsAPI.toggleFeatured(id, featured);
    showToast(featured ? "Project featured" : "Project unfeatured", "success");
    notifyProjectsUpdated();
    await loadProjects();
  } catch (error) {
    console.error("Failed to toggle featured:", error);
    showToast("Failed to update project", "error");
  }
}

async function toggleProjectVisible(id, visible) {
  try {
    await projectsAPI.toggleVisible(id, visible);
    showToast(visible ? "Project shown" : "Project hidden", "success");
    notifyProjectsUpdated();
    await loadProjects();
  } catch (error) {
    console.error("Failed to toggle visibility:", error);
    showToast("Failed to update project", "error");
  }
}

async function uploadProjectImage(file) {
  if (!file) return;
  try {
    const url = await projectsAPI.uploadImage(file);
    document.querySelector("#projectImageInput").dataset.url = url;
    document.querySelector("#projectImagePreview").innerHTML = `<img src="${url}" alt="Preview">`;
    showToast("Image uploaded successfully", "success");
  } catch (error) {
    console.error("Failed to upload project image:", error);
    showToast("Failed to upload image", "error");
  }
}

async function moveProjectOrder(id, direction) {
  try {
    const index = projectsList.findIndex(project => project.id === id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projectsList.length) return;

    const reordered = [...projectsList];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);

    const updates = reordered.map((project, position) => ({ id: project.id, display_order: position }));
    await Promise.all(updates.map(update => projectsAPI.update(update.id, { display_order: update.display_order })));
    notifyProjectsUpdated();
    await loadProjects();
  } catch (error) {
    console.error("Failed to move project:", error);
    showToast("Failed to move project", "error");
  }
}

function notifyProjectsUpdated() {
  try {
    window.dispatchEvent(new CustomEvent("projects:updated"));
  } catch (error) {
    console.warn("Failed to dispatch project update event", error);
  }

  try {
    localStorage.setItem("ingenium-projects-updated", String(Date.now()));
  } catch (error) {
    console.warn("Failed to persist project update signal", error);
  }
}

window.saveProject = saveProject;
window.deleteProject = deleteProject;
window.toggleProjectFeatured = toggleProjectFeatured;
window.toggleProjectVisible = toggleProjectVisible;
window.uploadProjectImage = uploadProjectImage;
window.initProjectsUI = initProjectsUI;
window.moveProjectOrder = moveProjectOrder;
window.resetProjectForm = resetProjectForm;
window.fillProjectForm = fillProjectForm;

export { initProjectsUI };
