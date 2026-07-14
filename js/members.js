const membersApp = {
    members: [],

    async refreshMembers() {
        try {
            const members = await window.membersApi.fetchMembers();
            this.members = members;
            window.membersUI.setMembers(members);
            return members;
        } catch (error) {
            console.error(error);
            showToast("Unable to load members.", "error");
            return [];
        }
    },

    init() {
        this.bindNavigation();
        window.membersUI.initMembersUI();
        window.membersUI.setMembers(this.members);
        window.initSortable();
        this.refreshMembers();
        window.dashboard?.initDashboard?.();
    },

    bindNavigation() {
        document.querySelectorAll(".nav-link").forEach((button) => {
            button.addEventListener("click", () => {
                document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.remove("active"));
                document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
                const targetView = document.getElementById(button.dataset.view);
                if (targetView) {
                    targetView.classList.add("active");
                }
                button.classList.add("active");
                document.body.classList.remove("sidebar-open");
            });
        });

        document.getElementById("mobileToggle")?.addEventListener("click", () => {
            document.body.classList.toggle("sidebar-open");
        });

        document.getElementById("confirmDeleteBtn")?.addEventListener("click", () => {
            window.membersUI.confirmDeleteMember();
        });

        document.getElementById("logoutBtn")?.addEventListener("click", async () => {
            await window.logoutAdmin();
        });
    }
};

window.membersApp = membersApp;
window.addEventListener("DOMContentLoaded", () => membersApp.init());
