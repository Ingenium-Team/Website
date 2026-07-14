async function loadWebsiteProjects() {
  try {
    if (!window.supabaseClient) {
      console.warn("Supabase client not available for projects");
      renderWebsiteProjects([]);
      return;
    }

    const { data, error } = await window.supabaseClient
      .from("projects")
      .select("*")
      .eq("visible", true)
      .order("featured", { ascending: false })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Failed to load projects:", error);
      renderWebsiteProjects([]);
      return;
    }
    
    renderWebsiteProjects(data || []);
  } catch (error) {
    console.error("Projects loader error:", error);
    renderWebsiteProjects([]);
  }
}

function refreshWebsiteProjects() {
  if (typeof loadWebsiteProjects === "function") {
    loadWebsiteProjects();
  }
}

window.addEventListener("projects:updated", refreshWebsiteProjects);
window.addEventListener("storage", (event) => {
  if (event.key === "ingenium-projects-updated") {
    refreshWebsiteProjects();
  }
});

function renderWebsiteProjects(projects) {
  const container = document.querySelector(".projects-grid");
  if (!container) return;

  if (!Array.isArray(projects) || projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--silver-dim);">
        No projects available yet.
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map((project, index) => {
    const imageMarkup = project.image_url
      ? `<img src="${project.image_url}" alt="${project.title}" class="project-image" />`
      : `<div class="project-thumb-inner" aria-hidden="true">${project.icon || "🧭"}</div>`;

    const statusClass = getWebsiteProjectStatus(project.status);
    const progressMarkup = project.progress != null && project.progress !== ""
      ? `
        <div class="project-progress-block">
          <div class="project-progress-bar">
            <div style="width:${Math.max(0, Math.min(100, Number(project.progress) || 0))}%"></div>
          </div>
          <div class="project-progress-meta">
            <span>${project.progress}%</span>
          </div>
        </div>
      `
      : "";

    const githubButton = project.github_url ? `<a href="${project.github_url}" target="_blank" rel="noreferrer" class="project-link-btn">GitHub</a>` : "";
    const demoButton = project.demo_url ? `<a href="${project.demo_url}" target="_blank" rel="noreferrer" class="project-link-btn">Demo</a>` : "";

    return `
      <article class="project-card reveal reveal-delay-${(index % 4) + 1}">
        <div class="project-thumb ${project.image_url ? "project-thumb-image" : "thumb-1"}">
          ${imageMarkup}
        </div>
        <div class="project-body">
          <span class="project-status ${statusClass}">${project.status || "In Progress"}</span>
          <h3 class="project-name">${project.title}</h3>
          <p class="project-desc">${project.short_description || project.full_description || "Project details coming soon."}</p>
          ${progressMarkup}
          ${project.category ? `<div class="project-category">${project.category}</div>` : ""}
          <div class="project-actions">
            ${githubButton}
            ${demoButton}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function getWebsiteProjectStatus(status) {
  const normalized = (status || "In Progress").toLowerCase();
  if (normalized.includes("live") || normalized.includes("complete") || normalized.includes("done")) return "status-live";
  if (normalized.includes("research") || normalized.includes("planning") || normalized.includes("planned")) return "status-research";
  return "status-dev";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadWebsiteProjects);
} else {
  loadWebsiteProjects();
}
