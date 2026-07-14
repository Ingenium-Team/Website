const TRACKS = [
  { key: "mechanical", label: "Mechanical", icon: "⚙️", department: "Mechanical Track" },
  { key: "software", label: "Software", icon: "💻", department: "Software Track" },
  { key: "hardware", label: "Hardware", icon: "🔧", department: "Hardware Track" },
  { key: "robotics", label: "Robotics", icon: "🤖", department: "Robotics Track" },
  { key: "business", label: "Business", icon: "📈", department: "Business Track" },
  { key: "media", label: "Media & Design", icon: "🎨", department: "Media Track" },
  { key: "logistics", label: "Logistics", icon: "🚚", department: "Logistics Track" },
  { key: "german", label: "German", icon: "🇩🇪", department: "German Track" }
];

const TRACK_LABELS = TRACKS.reduce((acc, track) => {
  acc[track.department] = track.label;
  return acc;
}, {});

let allMembers = [];
let activeTrack = "mechanical";

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function buildMemberCard(member) {
  const avatarMarkup = member.image_url
    ? `<img src="${member.image_url}" alt="${member.full_name}">`
    : `<span>${getInitials(member.full_name)}</span>`;

  return `
    <article class="member-card">
      <div class="member-avatar">${avatarMarkup}</div>
      <div class="member-name">${member.full_name}</div>
      <div class="member-role">${member.role}</div>
      <div class="member-dept">${member.department || ""}</div>
      <div class="member-badge">${member.role}</div>
    </article>
  `;
}

function getRoleGroup(member) {
  const normalized = (member.role || "").toLowerCase();
  if (normalized.includes("vice") || normalized.includes("co-") || normalized.includes("co")) return "Vice Head";
  if (normalized.includes("head") || normalized.includes("leader") || normalized.includes("director")) return "Head";
  return "Members";
}

function renderLeadershipPanel() {
  const leadershipGrid = document.getElementById("leadershipGrid");
  if (!leadershipGrid) return;

  const leadershipMembers = allMembers.filter(member => {
    const memberDept = (member.department || "").trim().toLowerCase();
    return memberDept === "leadership" || memberDept === "management";
  });

  leadershipGrid.innerHTML = leadershipMembers.length
    ? leadershipMembers.slice(0, 4).map(buildMemberCard).join("")
    : `<div class="empty-state">Leadership members will appear here once they are added.</div>`;
}

function renderTrackView() {
  const view = document.getElementById("teamExplorerView");
  if (!view) return;

  const selectedTrack = TRACKS.find(track => track.key === activeTrack) || TRACKS[0];
  
  const trackMembers = allMembers.filter(member => {
    const memberDept = (member.department || "").trim().toLowerCase();
    const selectedDept = (selectedTrack.department || "").trim().toLowerCase();
    return memberDept === selectedDept;
  });

  console.log("Current Track:", selectedTrack.label, "(", selectedTrack.department, ")");
  console.log("Database departments:", [...new Set(allMembers.map(m => m.department))]);
  console.log("Filtered members:", trackMembers.length, "found");

  const roles = ["Head", "Vice Head", "Members"];
  const grouped = roles.reduce((acc, role) => {
    acc[role] = trackMembers.filter(member => getRoleGroup(member) === role);
    return acc;
  }, {});

  const sections = [];
  roles.forEach(role => {
    const members = grouped[role];
    if (!members.length) return;
    sections.push(`
      <div class="section-block">
        <h4>${role}</h4>
        <div class="section-grid">
          ${members.map(buildMemberCard).join("")}
        </div>
      </div>
    `);
  });

  view.innerHTML = sections.length
    ? sections.join("")
    : `<div class="empty-state">No members are listed for this track yet.</div>`;
}

function renderTrackSelector() {
  const selector = document.getElementById("trackSelector");
  if (!selector) return;

  selector.innerHTML = TRACKS.map(track => `
    <button class="track-card-btn ${activeTrack === track.key ? "active" : ""}" data-track="${track.key}">
      <span class="ico">${track.icon}</span>
      <span>
        <strong>${track.label}</strong>
        <small>${track.department}</small>
      </span>
    </button>
  `).join("");

  selector.querySelectorAll(".track-card-btn").forEach(button => {
    button.addEventListener("click", () => {
      activeTrack = button.getAttribute("data-track");
      renderTrackSelector();
      renderTrackView();
    });
  });
}

async function loadTeamMembers() {
  try {
    const { data, error } = await window.supabaseClient
      .from("team_members")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Failed to load team members:", error);
      return;
    }

    allMembers = data || [];
    renderLeadershipPanel();
    renderTrackSelector();
    renderTrackView();
  } catch (err) {
    console.error("Team members load error:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadTeamMembers);
} else {
  loadTeamMembers();
}

window.loadTeamMembers = loadTeamMembers;