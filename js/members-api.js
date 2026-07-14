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
        return { success: true };
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
        // Normalize to 1-based sequential ordering using a two-phase update to avoid duplicates
        try {
            // Phase 1: assign temporary negative values to reserve unique slots
            for (let i = 0; i < orderedIds.length; i++) {
                const id = orderedIds[i];
                const tmp = -(i + 1);
                const { error: e1 } = await supabaseClient.from("team_members").update({ display_order: tmp }).eq("id", id);
                if (e1) throw e1;
            }

            // Phase 2: assign final 1-based values
            for (let i = 0; i < orderedIds.length; i++) {
                const id = orderedIds[i];
                const finalVal = i + 1;
                const { error: e2 } = await supabaseClient.from("team_members").update({ display_order: finalVal }).eq("id", id);
                if (e2) throw e2;
            }
        } catch (err) {
            throw err;
        }
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

    // If display_order has gaps or duplicates, normalize first
    const orders = (members || []).map((m) => Number(m.display_order));
    const needsNormalization = (() => {
        if (!orders.length) return false;
        const n = orders.length;
        const sorted = orders.slice().sort((a, b) => a - b);
        for (let i = 0; i < n; i++) {
            if (sorted[i] !== i + 1) return true;
        }
        return false;
    })();

    if (needsNormalization) {
        try {
            for (let i = 0; i < members.length; i++) {
                const id = members[i].id;
                const tmp = -(i + 1);
                const { error: e } = await supabaseClient.from("team_members").update({ display_order: tmp }).eq("id", id);
                if (e) throw e;
            }
            for (let i = 0; i < members.length; i++) {
                const id = members[i].id;
                const finalVal = i + 1;
                const { error: e } = await supabaseClient.from("team_members").update({ display_order: finalVal }).eq("id", id);
                if (e) throw e;
            }
        } catch (err) {
            throw err;
        }

        // refetch normalized members
        const { data: normalizedMembers, error: refetchErr } = await supabaseClient
            .from("team_members")
            .select("id, display_order")
            .eq("department", department)
            .order("display_order", { ascending: true });
        if (refetchErr) throw refetchErr;
        members.length = 0;
        if (normalizedMembers) normalizedMembers.forEach((m) => members.push(m));
    }

    const targetIndex = direction === "up" ? Math.max(0, currentIndex - 1) : Math.min(members.length - 1, currentIndex + 1);
    const targetMember = members[targetIndex];
    const currentMember = members[currentIndex];

    if (!targetMember || !currentMember || targetMember.id === currentMember.id) return;

    const [currentOrder, targetOrder] = [Number(currentMember.display_order), Number(targetMember.display_order)];

    // Perform a transaction-like swap using a temporary value to avoid duplicate display_order lingering
    const tempVal = 0; // safe because we normalized to 1..n above
    console.log("Reordering members:", {
        currentMemberId: currentMember.id,
        oldDisplayOrder: currentOrder,
        swappedWithId: targetMember.id,
        swappedWithOldDisplayOrder: targetOrder
    });

    const { error: e1 } = await supabaseClient.from("team_members").update({ display_order: tempVal }).eq("id", currentMember.id);
    if (e1) throw e1;

    const { error: e2 } = await supabaseClient.from("team_members").update({ display_order: currentOrder }).eq("id", targetMember.id);
    if (e2) throw e2;

    const { error: e3 } = await supabaseClient.from("team_members").update({ display_order: targetOrder }).eq("id", currentMember.id);
    if (e3) throw e3;

    console.log("Reordered members result:", {
        currentMemberId: currentMember.id,
        newDisplayOrder: targetOrder,
        swappedMemberId: targetMember.id,
        swappedMemberNewDisplayOrder: currentOrder
    });

    return {
        success: true,
        currentMemberId: currentMember.id,
        oldDisplayOrder: currentOrder,
        newDisplayOrder: targetOrder,
        swappedMemberId: targetMember.id,
        swappedMemberOldDisplayOrder: targetOrder,
        swappedMemberNewDisplayOrder: currentOrder
    };
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
