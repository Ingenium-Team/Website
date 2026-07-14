import { initProjectsUI, openProjectModal, closeProjectModal, saveProject } from "./admin-projects-ui.js";
import { initEventsUI, openEventModal, closeEventModal, saveEvent } from "./admin-events-ui.js";
import { initGalleryUI, openGalleryModal, closeGalleryModal, saveGalleryItem } from "./admin-gallery-ui.js";
import { initSettingsUI, saveSettingsUI, resetSettingsUI } from "./admin-settings-ui.js";

// Admin Dashboard CMS Initialization
// Initialize achievements and events modules when views are opened

function initCMSHandlers() {
  // Initialize achievements when the view is activated
  const achievementsView = document.getElementById("achievementsView");
  if (achievementsView) {
    const navLink = document.querySelector('[data-view="achievementsView"]');
    if (navLink) {
      navLink.addEventListener("click", () => {
        setTimeout(() => {
          if (typeof initAchievementsUI === 'function') {
            initAchievementsUI();
          }
        }, 100);
      });
    }
  }

  // Initialize events when the view is activated
  const eventsView = document.getElementById("eventsView");
  if (eventsView) {
    const navLink = document.querySelector('[data-view="eventsView"]');
    if (navLink) {
      navLink.addEventListener("click", () => {
        setTimeout(() => {
          if (typeof initEventsUI === 'function') {
            initEventsUI();
          }
        }, 100);
      });
    }
  }

  // Initialize projects when the view is activated
  const projectsView = document.getElementById("projectsView");
  if (projectsView) {
    const navLink = document.querySelector('[data-view="projectsView"]');
    if (navLink) {
      navLink.addEventListener("click", () => {
        setTimeout(() => {
          if (typeof initProjectsUI === 'function') {
            initProjectsUI();
          }
        }, 100);
      });
    }
  }

  // Initialize gallery when the view is activated
  const galleryView = document.getElementById("galleryView");
  if (galleryView) {
    const navLink = document.querySelector('[data-view="galleryView"]');
    if (navLink) {
      navLink.addEventListener("click", () => {
        setTimeout(() => {
          if (typeof initGalleryUI === 'function') {
            initGalleryUI();
          }
        }, 100);
      });
    }
  }

  // Setup achievement modal buttons
  const addAchievementBtn = document.getElementById("addAchievementBtn");
  if (addAchievementBtn) {
    addAchievementBtn.addEventListener("click", () => {
      if (typeof selectedAchievement !== 'undefined') {
        selectedAchievement = null;
      }
      if (typeof isEditMode !== 'undefined') {
        isEditMode = false;
      }
      if (typeof openAchievementModal === 'function') {
        openAchievementModal();
      } else {
        console.error("openAchievementModal is not a function");
      }
    });
  } else {
    console.error("addAchievementBtn not found");
  }

  const saveAchievementBtn = document.getElementById("saveAchievementBtn");
  if (saveAchievementBtn) {
    saveAchievementBtn.addEventListener("click", () => {
      if (typeof saveAchievement === 'function') {
        saveAchievement();
      } else {
        console.error("saveAchievement is not a function");
      }
    });
  } else {
    console.error("saveAchievementBtn not found");
  }

  // Setup event modal buttons
  const addEventBtn = document.getElementById("addEventBtn");
  if (addEventBtn) {
    console.log("Add Event button found");
    addEventBtn.addEventListener("click", () => {
      console.log("Add Event button clicked");
      console.log("Calling openEventModal()");
      if (typeof selectedEvent !== 'undefined') {
        selectedEvent = null;
      }
      if (typeof isEditMode !== 'undefined') {
        isEditMode = false;
      }
      if (typeof openEventModal === 'function') {
        openEventModal();
      } else if (typeof window.openEventModal === 'function') {
        window.openEventModal();
      } else {
        console.error("openEventModal is not available");
      }
    });
  } else {
    console.warn("Add Event button not found");
  }

  const saveEventBtn = document.getElementById("saveEventBtn");
  if (saveEventBtn) {
    saveEventBtn.addEventListener("click", () => {
      if (typeof saveEvent === 'function') {
        saveEvent();
      } else if (typeof window.saveEvent === 'function') {
        window.saveEvent();
      }
    });
  }

  // Setup project modal buttons
  const addProjectBtn = document.getElementById("addProjectBtn");
  if (addProjectBtn) {
    console.log("Add Project button found");
    addProjectBtn.addEventListener("click", () => {
      console.log("Add Project button clicked");
      console.log("Calling openProjectModal()");
      if (typeof selectedProject !== 'undefined') {
        selectedProject = null;
      }
      if (typeof isEditMode !== 'undefined') {
        isEditMode = false;
      }
      if (typeof openProjectModal === 'function') {
        openProjectModal();
      } else if (typeof window.openProjectModal === 'function') {
        window.openProjectModal();
      } else {
        console.error("openProjectModal is not available");
      }
    });
  } else {
    console.warn("Add Project button not found");
  }

  const saveProjectBtn = document.getElementById("saveProjectBtn");
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener("click", () => {
      if (typeof saveProject === 'function') {
        saveProject();
      } else if (typeof window.saveProject === 'function') {
        window.saveProject();
      }
    });
  }

  // Setup settings buttons
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", () => {
      if (typeof saveSettingsUI === 'function') {
        saveSettingsUI();
      }
    });
  }

  const resetSettingsBtn = document.getElementById("resetSettingsBtn");
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener("click", () => {
      if (typeof resetSettingsUI === 'function') {
        resetSettingsUI();
      }
    });
  }

  // Setup gallery modal buttons
  const addGalleryBtn = document.getElementById("addGalleryBtn");
  if (addGalleryBtn) {
    addGalleryBtn.addEventListener("click", () => {
      if (typeof openGalleryModal === 'function') {
        openGalleryModal();
      } else if (typeof window.openGalleryModal === 'function') {
        window.openGalleryModal();
      }
    });
  }

  const saveGalleryBtn = document.getElementById("saveGalleryBtn");
  if (saveGalleryBtn) {
    saveGalleryBtn.addEventListener("click", () => {
      if (typeof saveGalleryItem === 'function') {
        saveGalleryItem();
      } else if (typeof window.saveGalleryItem === 'function') {
        window.saveGalleryItem();
      }
    });
  }

  // Setup image dropzones
  if (typeof setupImageDropzone === 'function') {
    if (typeof uploadAchievementImage === 'function') {
      setupImageDropzone("achievementImageDropzone", "achievementImageInput", uploadAchievementImage);
    }
    if (typeof uploadEventImage === 'function') {
      setupImageDropzone("eventImageDropzone", "eventImageInput", uploadEventImage);
    }
    if (typeof uploadProjectImage === 'function') {
      setupImageDropzone("projectImageDropzone", "projectImageInput", uploadProjectImage);
    }
    if (typeof uploadGalleryImage === 'function') {
      setupImageDropzone("galleryImageDropzone", "galleryImageInput", uploadGalleryImage);
    }
  }

  // Setup modal close handlers
  document.querySelectorAll('[data-modal-close="achievementModal"]').forEach(btn => {
    btn.addEventListener("click", () => {
      if (typeof closeAchievementModal === 'function') {
        closeAchievementModal();
      }
    });
  });

  document.querySelectorAll('[data-modal-close="eventModal"]').forEach(btn => {
    btn.addEventListener("click", () => {
      if (typeof closeEventModal === 'function') {
        closeEventModal();
      } else if (typeof window.closeEventModal === 'function') {
        window.closeEventModal();
      }
    });
  });

  document.querySelectorAll('[data-modal-close="projectModal"]').forEach(btn => {
    btn.addEventListener("click", () => {
      if (typeof closeProjectModal === 'function') {
        closeProjectModal();
      }
    });
  });

  document.querySelectorAll('[data-modal-close="galleryModal"]').forEach(btn => {
    btn.addEventListener("click", () => {
      if (typeof closeGalleryModal === 'function') {
        closeGalleryModal();
      }
    });
  });

  // Load achievements on first view
  const achievementsView2 = document.getElementById("achievementsView");
  if (achievementsView2 && !achievementsView2.dataset.initialized) {
    if (typeof initAchievementsUI === 'function') {
      initAchievementsUI();
      achievementsView2.dataset.initialized = "true";
    }
  }

  // Load events on first view
  const eventsView2 = document.getElementById("eventsView");
  if (eventsView2 && !eventsView2.dataset.initialized) {
    if (typeof initEventsUI === 'function') {
      initEventsUI();
      eventsView2.dataset.initialized = "true";
    }
  }

  // Load projects on first view
  const projectsView2 = document.getElementById("projectsView");
  if (projectsView2 && !projectsView2.dataset.initialized) {
    if (typeof initProjectsUI === 'function') {
      initProjectsUI();
      projectsView2.dataset.initialized = "true";
    }
  }

  const galleryView2 = document.getElementById("galleryView");
  if (galleryView2 && !galleryView2.dataset.initialized) {
    if (typeof initGalleryUI === 'function') {
      initGalleryUI();
      galleryView2.dataset.initialized = "true";
    }
  }

  const settingsView2 = document.getElementById("settingsView");
  if (settingsView2 && !settingsView2.dataset.initialized) {
    if (typeof initSettingsUI === 'function') {
      initSettingsUI();
      settingsView2.dataset.initialized = "true";
    }
  }
}

function setupImageDropzone(dropzoneId, inputId, uploadHandler) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);

  if (!dropzone || !input) return;

  dropzone.addEventListener("click", () => input.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "rgba(196, 117, 58, 0.6)";
    dropzone.style.background = "rgba(196, 117, 58, 0.1)";
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "rgba(196, 117, 58, 0.3)";
    dropzone.style.background = "rgba(196, 117, 58, 0.02)";
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "rgba(196, 117, 58, 0.3)";
    dropzone.style.background = "rgba(196, 117, 58, 0.02)";

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      uploadHandler(file);
    }
  });

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadHandler(file);
    }
  });
}

window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.saveProject = saveProject;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
window.saveEvent = saveEvent;
window.initCMSHandlers = initCMSHandlers;

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCMSHandlers);
} else {
  initCMSHandlers();
}

export { initCMSHandlers };
