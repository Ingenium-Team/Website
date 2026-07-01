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

document.getElementById("addMemberBtn").onclick = () => {

    modal.style.display = "flex";

};

window.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

};
document.getElementById("saveMemberBtn").onclick = async () => {

    const member = {

        full_name: document.getElementById("memberName").value.trim(),

        role: document.getElementById("memberRole").value,

        department: document.getElementById("memberDepartment").value.trim(),

        email: document.getElementById("memberEmail").value.trim(),

    };

    if (!member.full_name || !member.role) {

        alert("Full Name and Role are required.");
        return;

    }

    const { error } = await supabaseClient
        .from("team_members")
        .insert(member);

    if (error) {

        console.error(error);
        alert(error.message);
        return;

    }

await loadMembers();

alert("✅ Member Added Successfully");
    modal.style.display = "none";

};
async function loadMembers(){

    const { data, error } = await supabaseClient
        .from("team_members")
        .select("*")
        .order("created_at",{ascending:false});
        console.log(data);
console.log(error);

    if(error){

        console.error(error);
        return;

    }

    const grid=document.getElementById("membersGrid");

    grid.innerHTML="";

    data.forEach(member=>{

        grid.innerHTML+=`

        <div class="member-card">

            <img src="${
                member.image_url ||
                "https://ui-avatars.com/api/?name="+encodeURIComponent(member.full_name)+"&background=081C2D&color=fff"
            }">

            <h3>${member.full_name}</h3>

            <div class="member-role">${member.role}</div>

            <p>${member.department || ""}</p>

            <div class="member-actions">

                <button class="edit-btn">
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