async function clearAdminSession() {
    try {
        if (window.supabaseClient?.auth) {
            await window.supabaseClient.auth.signOut();
        }
    } catch (error) {
        console.warn("Supabase signOut failed", error);
    }

    const tokenKeys = Object.keys(localStorage).filter((key) => key.includes("sb-") || key.includes("supabase") || key.includes("auth-token"));
    tokenKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.clear();
    sessionStorage.clear();
}

async function logoutAdmin() {
    await clearAdminSession();
    window.location.replace("login.html");
}

async function checkAdminSession() {
    const adminPages = ["dashboard.html", "team.html", "projects.html", "events.html", "achievements.html", "gallery.html", "messages.html", "settings.html"];
    const currentPath = window.location.pathname.split("/").pop();
    const isAdminPage = adminPages.includes(currentPath);

    if (!isAdminPage) {
        return false;
    }

    try {
        const { data: authData, error } = await supabaseClient.auth.getUser();
        if (error || !authData?.user) {
            await logoutAdmin();
            return false;
        }

        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("full_name, role")
            .eq("id", authData.user.id)
            .single();

        if (profileError || !profile) {
            await logoutAdmin();
            return false;
        }

        const allowedRoles = [
            "Team Leader",
            "Vice Team Leader",
            "Technical Head",
            "HR Head",
            "PR Head",
            "Board"
        ];

        if (!allowedRoles.includes(profile.role)) {
            await logoutAdmin();
            return false;
        }

        return true;
    } catch (err) {
        console.error("Admin session check failed", err);
        await logoutAdmin();
        return false;
    }
}

window.clearAdminSession = clearAdminSession;
window.logoutAdmin = logoutAdmin;
window.checkAdminSession = checkAdminSession;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        checkAdminSession();
    });
} else {
    checkAdminSession();
}