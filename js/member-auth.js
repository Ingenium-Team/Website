import { memberApi } from "./member-api.js";
import { initMemberUI, memberUI } from "./member-ui.js";

async function bootstrapMemberPortal() {
  try {
    const user = await memberApi.getCurrentUser();
    if (!user) {
      memberUI.renderAuth();
      return;
    }

    await memberUI.initializePortal(user.id);
  } catch (error) {
    console.error(error);
    showToast("Unable to initialize member portal", "error");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initMemberUI();
    bootstrapMemberPortal();
  });
} else {
  initMemberUI();
  bootstrapMemberPortal();
}

window.bootstrapMemberPortal = bootstrapMemberPortal;
export { bootstrapMemberPortal };
