export const TRACKS = [
    { key: "Leadership", label: "Leadership", icon: "👑" },
    { key: "Management", label: "Management", icon: "🧭" },
    { key: "Mechanical Track", label: "Mechanical", icon: "⚙️" },
    { key: "Software Track", label: "Software", icon: "💻" },
    { key: "Hardware Track", label: "Hardware", icon: "🔌" },
    { key: "Robotics Track", label: "Robotics", icon: "🤖" },
    { key: "Business Track", label: "Business", icon: "📈" },
    { key: "Media Track", label: "Media", icon: "🎨" },
    { key: "Logistics Track", label: "Logistics", icon: "📦" },
    { key: "HR Track", label: "HR", icon: "💪" },
    { key: "German Track", label: "German", icon: "🇩🇪" }
];

export const TRACK_ROLE_MAP = {
    Leadership: ["Team Leader", "Vice Leader"],
    Management: ["Technical Director", "Non-Technical Director", "HR Head"],
    "Mechanical Track": ["Head", "Vice Head", "Member"],
    "Software Track": ["Head", "Vice Head", "Member"],
    "Hardware Track": ["Head", "Vice Head", "Member"],
    "Robotics Track": ["Head", "Vice Head", "Member"],
    "Business Track": ["Head", "Vice Head", "Member"],
    "Media Track": ["Head", "Vice Head", "Member"],
    "Logistics Track": ["Head", "Vice Head", "Member"],
    "HR Track": ["Head", "Vice Head", "Member"],
    "German Track": ["Head", "Vice Head", "Member"]
};

export function getInitials(name = "") {
    return (name || "?")
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

export function getTrackLabel(track) {
    return TRACKS.find((item) => item.key === track)?.label || track;
}

export function getTrackIcon(track) {
    return TRACKS.find((item) => item.key === track)?.icon || "📌";
}

export function getDisplayMembers(members, activeTrack) {
    if (activeTrack === "Leadership") {
        return members.filter((member) => member.department === "Leadership" || member.department === "Management");
    }

    return members.filter((member) => member.department === activeTrack);
}

export function getMemberSections(members, activeTrack) {
    const filtered = getDisplayMembers(members, activeTrack);
    const heads = filtered.filter((member) => member.role && member.role.toLowerCase().includes("head") && !member.role.toLowerCase().includes("vice"));
    const viceHeads = filtered.filter((member) => member.role && member.role.toLowerCase().includes("vice"));
    const regularMembers = filtered.filter((member) => !member.role || (!member.role.toLowerCase().includes("head") && !member.role.toLowerCase().includes("vice")));

    return [
        { title: "👑 Head", members: heads },
        { title: "💼 Vice Head", members: viceHeads },
        { title: "👥 Members", members: regularMembers }
    ];
}

export function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function getDashboardStats(members) {
    const technical = ["Mechanical Track", "Software Track", "Hardware Track", "Robotics Track"].filter((track) => members.some((member) => member.department === track)).length;
    const nonTechnical = ["Business Track", "Media Track", "Logistics Track", "HR Track", "German Track", "Leadership", "Management"].filter((track) => members.some((member) => member.department === track)).length;

    return [
        { title: "Total Members", value: members.length, subtitle: "Active team roster", icon: "👥" },
        { title: "Technical Tracks", value: technical, subtitle: "Tracks with members", icon: "⚙️" },
        { title: "Non-Technical Tracks", value: nonTechnical, subtitle: "Tracks with members", icon: "📈" },
        { title: "Projects", value: 0, subtitle: "No projects synced yet", icon: "📁" },
        { title: "Upcoming Events", value: 0, subtitle: "No events synced yet", icon: "📅" },
        { title: "Gallery Images", value: 0, subtitle: "No gallery items synced yet", icon: "🖼" },
        { title: "Messages", value: 0, subtitle: "No messages synced yet", icon: "📨" }
    ];
}
