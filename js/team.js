console.log("TEAM JS LOADED");

async function loadTeamMembers() {

    const { data, error } = await supabaseClient
    .from("team_members")
    .select("*")
    .order("display_order", { ascending: true });

    console.log(data);
    console.log(error);

    if (error) return;

    const teamGrid = document.getElementById("teamGrid");

    teamGrid.innerHTML = "";

    console.log("DATA:", data);
console.log("ERROR:", error);;
 data.forEach((member, index) => {
console.log(member.full_name);
    const initials = (member.full_name || "?")
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0,2)
        .toUpperCase();

    const featured =
        member.role === "Team Leader" ||
        member.role === "Vice Leader";

    teamGrid.innerHTML += `
<div class="member-card ${featured ? "featured-card" : ""} reveal reveal-delay-${(index % 5) + 1}">

    ${
        member.image_url
            ? `
                <img
                    class="member-avatar-image"
                    src="${member.image_url}"
                    alt="${member.full_name}"
                >
            `
            : `
                <div class="member-avatar">
                    ${member.full_name
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .substring(0,2)}
                </div>
            `
    }

    <div class="member-name">${member.full_name}</div>
    <div class="member-role">${member.role}</div>
    <div class="member-track">${member.department || ""}</div>

</div>
    `;

});
console.log(teamGrid.innerHTML);
}

loadTeamMembers();