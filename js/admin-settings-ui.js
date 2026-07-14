let settingsFormState = {};
let settingsDirty = false;
let settingsLoaded = false;

const SETTINGS_CATEGORIES = [
  {
    id: "general",
    title: "General",
    fields: [
      { key: "team_name", label: "Team Name", type: "text" },
      { key: "motto", label: "Motto", type: "text" },
      { key: "hero_title", label: "Hero Title", type: "text" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea" },
      { key: "about_paragraph", label: "About Paragraph", type: "textarea" },
      { key: "founded_year", label: "Founded Year", type: "number" },
      { key: "university", label: "University", type: "text" },
      { key: "faculty", label: "Faculty", type: "text" }
    ]
  },
  {
    id: "branding",
    title: "Branding",
    fields: [
      { key: "logo_url", label: "Logo", type: "image" },
      { key: "favicon_url", label: "Favicon", type: "image" },
      { key: "hero_background_url", label: "Hero Background", type: "image" }
    ]
  },
  {
    id: "contact",
    title: "Contact",
    fields: [
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "whatsapp", label: "WhatsApp", type: "text" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "google_maps_link", label: "Google Maps Link", type: "text" }
    ]
  },
  {
    id: "social",
    title: "Social Media",
    fields: [
      { key: "facebook", label: "Facebook", type: "text" },
      { key: "instagram", label: "Instagram", type: "text" },
      { key: "linkedin", label: "LinkedIn", type: "text" },
      { key: "github", label: "GitHub", type: "text" },
      { key: "youtube", label: "YouTube", type: "text" },
      { key: "tiktok", label: "TikTok", type: "text" },
      { key: "discord", label: "Discord", type: "text" }
    ]
  },
  {
    id: "homepage",
    title: "Homepage Sections",
    fields: [
      { key: "show_hero", label: "Hero", type: "toggle" },
      { key: "show_statistics", label: "Statistics", type: "toggle" },
      { key: "show_direction", label: "Direction & Focus", type: "toggle" },
      { key: "show_achievements", label: "Achievements", type: "toggle" },
      { key: "show_events", label: "Upcoming Events", type: "toggle" },
      { key: "show_gallery", label: "Gallery", type: "toggle" },
      { key: "show_team", label: "Team", type: "toggle" },
      { key: "show_sponsors", label: "Sponsors", type: "toggle" }
    ]
  },
  {
    id: "statistics",
    title: "Statistics",
    fields: [
      { key: "stats_members", label: "Members", type: "number" },
      { key: "stats_projects", label: "Projects", type: "number" },
      { key: "stats_events", label: "Events", type: "number" },
      { key: "stats_achievements", label: "Achievements", type: "number" },
      { key: "stats_years", label: "Years", type: "number" }
    ]
  },
  {
    id: "theme",
    title: "Theme",
    fields: [
      { key: "primary_color", label: "Primary Color", type: "color" },
      { key: "secondary_color", label: "Secondary Color", type: "color" },
      { key: "accent_color", label: "Accent Color", type: "color" },
      { key: "border_radius", label: "Border Radius", type: "text" },
      { key: "font_family", label: "Font Family", type: "text" }
    ]
  },
  {
    id: "footer",
    title: "Footer",
    fields: [
      { key: "footer_text", label: "Copyright Text", type: "text" },
      { key: "footer_developed_by", label: "Developed By", type: "text" },
      { key: "footer_description", label: "Footer Description", type: "textarea" }
    ]
  },
  {
    id: "seo",
    title: "SEO",
    fields: [
      { key: "website_title", label: "Website Title", type: "text" },
      { key: "meta_description", label: "Meta Description", type: "textarea" },
      { key: "keywords", label: "Keywords", type: "text" },
      { key: "og_image_url", label: "OpenGraph Image", type: "image" }
    ]
  },
  {
    id: "security",
    title: "Security",
    fields: [
      { key: "session_timeout", label: "Session Timeout", type: "number" },
      { key: "auto_logout", label: "Auto Logout", type: "toggle" },
      { key: "require_login", label: "Require Login", type: "toggle" }
    ]
  }
];

function getDefaultState() {
  const defaults = window.defaultWebsiteSettings || {};
  const state = {};
  SETTINGS_CATEGORIES.forEach((category) => {
    category.fields.forEach((field) => {
      state[field.key] = defaults[field.key] ?? "";
    });
  });
  return state;
}

function renderSettingsSidebar() {
  const container = document.getElementById("settingsContent");
  if (!container) return;

  container.innerHTML = `
    <div class="settings-layout">
      <aside class="settings-sidebar">
        ${SETTINGS_CATEGORIES.map((category) => `<button class="settings-sidebar-btn" data-target="${category.id}" type="button">${category.title}</button>`).join("")}
      </aside>
      <div class="settings-panels">
        ${SETTINGS_CATEGORIES.map((category) => `
          <section class="settings-panel" id="settings-${category.id}">
            <div class="settings-panel-header">
              <h3>${category.title}</h3>
              <p>Update ${category.title.toLowerCase()} values for the public website.</p>
            </div>
            <div class="settings-fields">
              ${category.fields.map((field) => renderField(field)).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    </div>
  `;

  container.querySelectorAll(".settings-sidebar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      document.querySelectorAll(".settings-panel").forEach((panel) => panel.classList.remove("active"));
      const panel = document.getElementById(`settings-${target}`);
      if (panel) panel.classList.add("active");
    });
  });

  const firstPanel = container.querySelector(".settings-panel");
  if (firstPanel) firstPanel.classList.add("active");
  attachSettingsListeners();
}

function renderField(field) {
  const value = settingsFormState[field.key] ?? "";
  if (field.type === "toggle") {
    return `
      <label class="settings-field">
        <span>${field.label}</span>
        <input type="checkbox" data-setting="${field.key}" ${value === "true" || value === true ? "checked" : ""}>
      </label>
    `;
  }

  if (field.type === "image") {
    return `
      <div class="settings-field">
        <label>${field.label}</label>
        <div class="image-dropzone settings-dropzone" data-setting="${field.key}">
          <div class="image-preview-wrapper">
            ${value ? `<img src="${value}" alt="${field.label}">` : `<span>Upload image</span>`}
          </div>
          <input type="file" accept="image/*" hidden>
        </div>
      </div>
    `;
  }

  if (field.type === "textarea") {
    return `
      <label class="settings-field">
        <span>${field.label}</span>
        <textarea data-setting="${field.key}">${value}</textarea>
      </label>
    `;
  }

  if (field.type === "color") {
    return `
      <label class="settings-field">
        <span>${field.label}</span>
        <input type="color" data-setting="${field.key}" value="${value || "#0f172a"}">
      </label>
    `;
  }

  return `
    <label class="settings-field">
      <span>${field.label}</span>
      <input type="${field.type === "number" ? "number" : "text"}" data-setting="${field.key}" value="${value}">
    </label>
  `;
}

function attachSettingsListeners() {
  document.querySelectorAll("[data-setting]").forEach((element) => {
    const isCheckbox = element.type === "checkbox";
    element.addEventListener("input", () => {
      const key = element.getAttribute("data-setting");
      const value = isCheckbox ? element.checked : element.value;
      settingsFormState[key] = value;
      settingsDirty = true;
      updateSettingsStatus();
    });
  });

  document.querySelectorAll(".settings-dropzone").forEach((dropzone) => {
    dropzone.addEventListener("click", () => {
      const input = dropzone.querySelector("input[type='file']");
      if (input) input.click();
    });

    const input = dropzone.querySelector("input[type='file']");
    if (input) {
      input.addEventListener("change", async (event) => {
        const [file] = event.target.files || [];
        if (!file) return;
        const key = dropzone.getAttribute("data-setting");
        try {
          const url = await window.settingsAPI.uploadSettingImage(file, key);
          settingsFormState[key] = url;
          settingsDirty = true;
          updateSettingsStatus();
          const preview = dropzone.querySelector(".image-preview-wrapper");
          if (preview) {
            preview.innerHTML = `<img src="${url}" alt="Preview">`;
          }
          showToast("Image uploaded", "success");
        } catch (error) {
          console.error(error);
          showToast("Image upload failed", "error");
        }
      });
    }
  });
}

function updateSettingsStatus() {
  const saveBtn = document.getElementById("saveSettingsBtn");
  if (saveBtn) {
    saveBtn.textContent = settingsDirty ? "Save All *" : "Save All";
  }
}

async function initSettingsUI() {
  if (settingsLoaded) {
    renderSettingsSidebar();
    return;
  }

  try {
    const loaded = await window.settingsAPI.loadSettings();
    settingsFormState = { ...getDefaultState(), ...loaded };
    settingsLoaded = true;
    renderSettingsSidebar();
    updateSettingsStatus();
  } catch (error) {
    console.error(error);
    showToast("Failed to load settings", "error");
  }
}

async function saveSettingsUI() {
  try {
    const payload = { ...settingsFormState };
    await window.settingsAPI.saveAllSettings(payload);
    settingsDirty = false;
    updateSettingsStatus();
    showToast("Settings saved", "success");
  } catch (error) {
    console.error(error);
    showToast("Failed to save settings", "error");
  }
}

function resetSettingsUI() {
  settingsFormState = { ...getDefaultState() };
  settingsDirty = false;
  renderSettingsSidebar();
  updateSettingsStatus();
}

window.initSettingsUI = initSettingsUI;
window.saveSettingsUI = saveSettingsUI;
window.resetSettingsUI = resetSettingsUI;
window.renderSettingsSidebar = renderSettingsSidebar;

export { initSettingsUI, saveSettingsUI, resetSettingsUI };
