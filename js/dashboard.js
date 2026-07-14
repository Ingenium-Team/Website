import { getDashboardStats } from "./utils.js";

async function loadDashboard() {
    const { data: authData } = await supabaseClient.auth.getUser();
    if (!authData.user) return;

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", authData.user.id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const userName = document.getElementById("userName");
    if (userName) {
        userName.textContent = `${profile.full_name} • ${profile.role}`;
    }
}

function renderDashboardStats(members) {
    const container = document.getElementById("statsGrid");
    if (!container) return;

    const stats = getDashboardStats(members);
    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    stats.forEach((stat) => {
        const card = document.createElement("article");
        card.className = "metric-card";
        card.innerHTML = `
            <div class="metric-icon">${stat.icon}</div>
            <div class="metric-title">${stat.title}</div>
            <div class="metric-value">${stat.value}</div>
            <div class="metric-subtitle">${stat.subtitle}</div>
        `;
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

async function initDashboard() {
    await loadDashboard();
    const members = await window.membersApp?.refreshMembers?.();
    if (members) {
        renderDashboardStats(members);
    }
}

window.dashboard = { initDashboard, renderDashboardStats };
export { initDashboard, renderDashboardStats };
