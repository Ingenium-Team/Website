import { TRACK_ROLE_MAP } from "./utils.js";

async function fetchMembers() {
    const { data, error } = await supabaseClient
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });

    if (error) {
        throw error;
    }

    return data || [];
}

async function saveMember(member, id = null) {
    if (id) {
        const { error } = await supabaseClient.from("team_members").update(member).eq("id", id);
        if (error) throw error;
        return;
    }

    const { error } = await supabaseClient.from("team_members").insert(member);
    if (error) throw error;
}

async function deleteMemberById(id) {
    const { error } = await supabaseClient.from("team_members").delete().eq("id", id);
    if (error) throw error;
}

async function updateMemberOrder(memberId, direction, department) {
    if (Array.isArray(memberId)) {
        const orderedIds = memberId;
        const updates = orderedIds.map((id, index) =>
            supabaseClient.from("team_members").update({ display_order: index }).eq("id", id)
        );
        const results = await Promise.all(updates);
        const errors = results.map((result) => result.error).filter(Boolean);
        if (errors.length) throw errors[0];
        return;
    }

    const { data: members, error: fetchError } = await supabaseClient
        .from("team_members")
        .select("id, display_order")
        .eq("department", department)
        .order("display_order", { ascending: true });

    if (fetchError) throw fetchError;

    const currentIndex = (members || []).findIndex((member) => member.id === memberId);

    if (currentIndex < 0 || !members || members.length <= 1) return;

    const targetIndex = direction === "up" ? Math.max(0, currentIndex - 1) : Math.min(members.length - 1, currentIndex + 1);
    const targetMember = members[targetIndex];
    const currentMember = members[currentIndex];

    if (!targetMember || !currentMember || targetMember.id === currentMember.id) return;

    const [currentOrder, targetOrder] = [currentMember.display_order, targetMember.display_order];

    await supabaseClient.from("team_members").update({ display_order: targetOrder }).eq("id", currentMember.id);
    await supabaseClient.from("team_members").update({ display_order: currentOrder }).eq("id", targetMember.id);
}

async function uploadMemberImage(file) {
    if (!file) return null;

    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabaseClient.storage.from("team").upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage.from("team").getPublicUrl(fileName);
    return data.publicUrl;
}

async function getUserProfile() {
    const { data: authData } = await supabaseClient.auth.getUser();
    if (!authData.user) return null;

    const { data, error } = await supabaseClient.from("profiles").select("full_name, role").eq("id", authData.user.id).single();
    if (error) throw error;
    return { authUser: authData.user, profile: data };
}

function getRoleOptions(department) {
    return TRACK_ROLE_MAP[department] || [];
}

window.membersApi = {
    fetchMembers,
    saveMember,
    deleteMemberById,
    updateMemberOrder,
    uploadMemberImage,
    getUserProfile,
    getRoleOptions
};
