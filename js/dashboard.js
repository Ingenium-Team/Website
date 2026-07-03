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

    document.getElementById("userName").innerHTML =
        `${profile.full_name} • ${profile.role}`;
}

loadDashboard();

const modal = document.getElementById("memberModal");
let editingMemberId = null;

document.getElementById("addMemberBtn").onclick = () => {

    editingMemberId = null;

    document.getElementById("memberName").value = "";
    document.getElementById("memberRole").value = "";
    document.getElementById("department").value = "";
    document.getElementById("memberEmail").value = "";

    document.getElementById("saveMemberBtn").textContent = "Add Member";

    modal.style.display = "flex";
};

window.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

};
document.getElementById("saveMemberBtn").onclick = async () => {
const isEditing = editingMemberId !== null;
    const member = {

        full_name: document.getElementById("memberName").value.trim(),

        role: document.getElementById("memberRole").value,

        display_order: Number(document.getElementById("displayOrder").value),

department: document.getElementById("department").value,

        email: document.getElementById("memberEmail").value.trim(),

    };
const file = document.getElementById("memberImage").files[0];

if (file) {

    const fileName =
        Date.now() + "-" + file.name;

    const { error: uploadError } =
        await supabaseClient.storage
            .from("team")
            .upload(fileName, file);

    if (uploadError) {

        alert(uploadError.message);
        return;

    }

    const { data } =
        supabaseClient.storage
            .from("team")
            .getPublicUrl(fileName);

    member.image_url = data.publicUrl;

}
    if (!member.full_name || !member.role) {

        alert("Full Name and Role are required.");
        return;

    }

    let error;

if (editingMemberId) {

    ({ error } = await supabaseClient
        .from("team_members")
        .update(member)
        .eq("id", editingMemberId));

} else {

    ({ error } = await supabaseClient
        .from("team_members")
        .insert(member));

}

    if (error) {

        console.error(error);
        alert(error.message);
        return;

    }

await loadMembers();
    editingMemberId = null;

    modal.style.display = "none";

    alert(
        isEditing
            ? "✅ Member Updated Successfully"
            : "✅ Member Added Successfully"
);
};
async function loadMembers(){

    const { data, error } = await supabaseClient
    .from("team_members")
    .select("*")
    .order("display_order", { ascending: true });
        console.log(data);
console.log(error);

    if(error){

        console.error(error);
        return;

    }

    const grid=document.getElementById("membersGrid");

    grid.innerHTML="";

    data.forEach(member=>{
initSortable();
        grid.innerHTML+=`

<div class="member-card" data-id="${member.id}">
<div class="drag-handle">☰</div>
 ${
    member.image_url
        ? `<img
                class="member-avatar-img"
                src="${member.image_url}"
                alt="${member.full_name}">
          `
        : `<div class="member-avatar">
                ${(member.full_name || "?")
                    .split(" ")
                    .map(word => word[0])
                    .join("")
                    .substring(0,2)
                    .toUpperCase()}
           </div>`
}

            <h3>${member.full_name}</h3>

            <div class="member-role">${member.role}</div>

            <p>${member.department || ""}</p>

            <div class="member-actions">

                <button class="edit-btn" onclick="editMember('${member.id}')">
    Edit
</button>

               <button class="delete-btn" onclick="deleteMember('${member.id}')">
    Delete
</button>

            </div>

        </div>

        `;

    });

}
function initSortable() {

    new Sortable(document.getElementById("membersGrid"), {

        animation: 200,
    handle:".drag-handle",

        ghostClass: "dragging",

        onEnd: async () => {

            const cards = document.querySelectorAll(".member-card");

            for (let i = 0; i < cards.length; i++) {

                await supabaseClient
                    .from("team_members")
                    .update({
                        display_order: i + 1
                    })
                    .eq("id", cards[i].dataset.id);

            }

            loadMembers();

        }

    });

}


async function deleteMember(id) {

    if (!confirm("Are you sure you want to delete this member?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("team_members")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    await loadMembers();

    alert("✅ Member Deleted Successfully");
}
loadDashboard();

loadMembers();
async function editMember(id) {

    const { data, error } = await supabaseClient
        .from("team_members")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    editingMemberId = id;

    document.getElementById("memberName").value = data.full_name || "";
    document.getElementById("memberRole").value = data.role || "";
    document.getElementById("department").value = data.department || "";
    document.getElementById("memberEmail").value = data.email || "";

    document.getElementById("saveMemberBtn").textContent = "Update Member";

    modal.style.display = "flex";
}
let sortable;

function initSortable() {

    if (sortable) sortable.destroy();

    sortable = new Sortable(document.getElementById("membersGrid"), {

        animation: 200,

        ghostClass: "dragging",

        onEnd: async () => {

            const cards = [...document.querySelectorAll(".member-card")];

            for (let i = 0; i < cards.length; i++) {

                await supabaseClient
                    .from("team_members")
                    .update({
                        display_order: i + 1
                    })
                    .eq("id", cards[i].dataset.id);

            }

            loadMembers();

        }

    });

}