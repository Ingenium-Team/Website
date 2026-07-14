import { TRACKS, getInitials, getTrackLabel, getTrackIcon, getMemberSections, escapeHtml } from "./utils.js";

let activeTrack = "Leadership";
let searchTerm = "";
let currentMembers = [];
let currentEditingId = null;
let uiInitialized = false;

function renderTrackFilters(container) {
    if (!container) return;

    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    TRACKS.forEach((track) => {
        const button = document.createElement("button");
        button.className = `track-card${track.key === activeTrack ? " active" : ""}`;
        button.type = "button";
        button.dataset.track = track.key;
        button.innerHTML = `<span>${track.icon}</span><span>${track.label}</span>`;
        button.addEventListener("click", () => {
            activeTrack = track.key;
            renderMembers();
            renderTrackFilters(container);
        });
        fragment.appendChild(button);
    });

    container.appendChild(fragment);
}

function renderMemberCard(member) {
    const card = document.createElement("article");
    card.className = "member-card";
    card.dataset.id = member.id;
    card.innerHTML = `
        <div class="member-avatar">
            ${member.image_url ? `<img src="${member.image_url}" alt="${escapeHtml(member.full_name || "Member")}">` : getInitials(member.full_name)}
        </div>
        <h4 class="member-name">${escapeHtml(member.full_name || "Unnamed")}</h4>
        <div class="member-role">${escapeHtml(member.role || "Member")}</div>
        <div class="member-department">${escapeHtml(getTrackLabel(member.department))}</div>
        <div class="member-actions">
            <button class="edit-btn" type="button" data-action="edit">Edit</button>
            <button class="delete-btn" type="button" data-action="delete">Delete</button>
        </div>
        <div class="member-order-actions">
            <button class="order-btn" type="button" data-action="move-up">⬆ Move Up</button>
            <button class="order-btn" type="button" data-action="move-down">⬇ Move Down</button>
        </div>
    `;

    card.querySelector("[data-action='edit']").addEventListener("click", () => openMemberModal(member.id));
    card.querySelector("[data-action='delete']").addEventListener("click", () => requestDeleteMember(member.id, member.full_name));
    card.querySelector("[data-action='move-up']").addEventListener("click", () => moveMemberOrder(member.id, "up"));
    card.querySelector("[data-action='move-down']").addEventListener("click", () => moveMemberOrder(member.id, "down"));
    return card;
}

function renderSection(title, members) {
    const sectionEl = document.createElement("section");
    sectionEl.className = "members-section";
    sectionEl.innerHTML = `<div class="section-divider"></div><h3>${title}</h3>`;
    const cards = document.createElement("div");
    cards.className = "members-grid";

    members.forEach((member) => cards.appendChild(renderMemberCard(member)));
    sectionEl.appendChild(cards);
    return sectionEl;
}

function renderMembers() {
    const grid = document.getElementById("membersGrid");
    if (!grid) return;

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = currentMembers.filter((member) => {
        if (!normalizedSearch) return true;
        const haystack = `${member.full_name || ""} ${member.role || ""} ${member.department || ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
    });

    const displayMembers = activeTrack === "Leadership"
        ? filtered.filter((member) => member.department === "Leadership" || member.department === "Management")
        : filtered.filter((member) => member.department === activeTrack);

    grid.innerHTML = "";
    if (!displayMembers.length) {
        grid.innerHTML = '<div class="empty-state">No members match this view yet.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    const sections = getMemberSections(displayMembers, activeTrack);

    sections.forEach((section) => {
        if (!section.members.length) return;
        fragment.appendChild(renderSection(section.title, section.members));
    });

    grid.appendChild(fragment);
}

function normalizeMemberId(id) {
    if (typeof id === "string" && id.trim() !== "" && !Number.isNaN(Number(id))) {
        return Number(id);
    }
    return id;
}

function setMembers(members) {
    currentMembers = members;
    renderMembers();
}

function setActiveTrack(track) {
    activeTrack = track;
    renderMembers();
}

function setSearchTerm(term) {
    searchTerm = term;
    renderMembers();
}

function resetForm() {
    currentEditingId = null;
    document.getElementById("memberName").value = "";
    document.getElementById("memberRole").value = "";
    document.getElementById("department").value = "Leadership";
    document.getElementById("memberEmail").value = "";
    document.getElementById("displayOrder").value = "";
    document.getElementById("memberImage").value = "";
    updateRoleOptions();
    document.getElementById("saveMemberBtn").textContent = "Add Member";
    document.getElementById("memberFormTitle").textContent = "Add Team Member";
    const preview = document.getElementById("previewImage");
    preview.src = "";
    preview.style.display = "none";
}

function fillForm(member) {
    currentEditingId = member.id;
    document.getElementById("memberName").value = member.full_name || "";
    document.getElementById("memberRole").value = member.role || "";
    document.getElementById("department").value = member.department || "Leadership";
    document.getElementById("memberEmail").value = member.email || "";
    document.getElementById("displayOrder").value = member.display_order || "";
    document.getElementById("saveMemberBtn").textContent = "Save Member";
    document.getElementById("memberFormTitle").textContent = "Edit Team Member";
    updateRoleOptions();
    document.getElementById("memberRole").value = member.role || "";

    if (member.image_url) {
        const preview = document.getElementById("previewImage");
        preview.src = member.image_url;
        preview.style.display = "block";
    }
}

function updateRoleOptions() {
    const department = document.getElementById("department").value;
    const roleSelect = document.getElementById("memberRole");
    roleSelect.innerHTML = "";

    const roles = window.membersApi.getRoleOptions(department);
    roles.forEach((role) => {
        const option = document.createElement("option");
        option.value = role;
        option.textContent = role;
        roleSelect.appendChild(option);
    });
}

function bindEvents() {
    const searchInput = document.getElementById("memberSearch");
    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            setSearchTerm(event.target.value);
        });
    }

    const department = document.getElementById("department");
    if (department) {
        department.addEventListener("change", updateRoleOptions);
    }

    const addButton = document.getElementById("addMemberBtn");
    if (addButton) {
        addButton.addEventListener("click", () => {
            resetForm();
            openModal("memberModal");
        });
    }

    const saveButton = document.getElementById("saveMemberBtn");
    if (saveButton) {
        saveButton.addEventListener("click", handleSaveMember);
    }

    const imageInput = document.getElementById("memberImage");
    if (imageInput) {
        imageInput.addEventListener("change", (event) => previewSelectedImage(event.target.files[0]));
    }

    const dropzone = document.getElementById("imageDropzone");
    if (dropzone) {
        ["dragenter", "dragover"].forEach((eventName) => {
            dropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropzone.classList.add("drag-over");
            });
        });

        ["dragleave", "drop"].forEach((eventName) => {
            dropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropzone.classList.remove("drag-over");
            });
        });

        dropzone.addEventListener("click", () => {
            document.getElementById("memberImage")?.click();
        });

        dropzone.addEventListener("drop", (event) => {
            const file = event.dataTransfer.files[0];
            if (file) {
                previewSelectedImage(file);
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                imageInput.files = dataTransfer.files;
            }
        });
    }
}

async function handleSaveMember() {
    const member = {
        full_name: document.getElementById("memberName").value.trim(),
        role: document.getElementById("memberRole").value,
        department: document.getElementById("department").value,
        email: document.getElementById("memberEmail").value.trim(),
        display_order: Number(document.getElementById("displayOrder").value) || 0
    };

    if (!member.full_name || !member.role) {
        showToast("Full name and role are required.", "error");
        return;
    }

    try {
        const file = document.getElementById("memberImage").files[0];
        if (file) {
            member.image_url = await window.membersApi.uploadMemberImage(file);
        }

        await window.membersApi.saveMember(member, currentEditingId);
        await window.membersApp.refreshMembers();
        closeModal("memberModal");
        showToast(currentEditingId ? "Member updated successfully." : "Member added successfully.", currentEditingId ? "success" : "success");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to save member.", "error");
    }
}

async function openMemberModal(id) {
    if (!id && id !== 0) {
        resetForm();
        openModal("memberModal");
        return;
    }

    const normalizedId = normalizeMemberId(id);

    try {
        const members = await window.membersApi.fetchMembers();
        const member = members.find((item) => item.id === normalizedId);
        if (!member) return;
        fillForm(member);
        openModal("memberModal");
    } catch (error) {
        console.error(error);
        showToast("Unable to load member details.", "error");
    }
}

async function requestDeleteMember(id, name) {
    const confirmName = document.getElementById("confirmMemberName");
    const confirmMessage = document.getElementById("confirmMessage");
    if (confirmName) confirmName.textContent = name || "this member";
    if (confirmMessage) confirmMessage.textContent = "This action cannot be undone.";
    document.getElementById("confirmDeleteBtn").dataset.memberId = normalizeMemberId(id);
    openModal("deleteModal");
}

async function confirmDeleteMember() {
    const rawId = document.getElementById("confirmDeleteBtn").dataset.memberId;
    const id = normalizeMemberId(rawId);
    if (!id && id !== 0) return;

    try {
        await window.membersApi.deleteMemberById(id);
        await window.membersApp.refreshMembers();
        closeModal("deleteModal");
        showToast("Member deleted successfully.", "success");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to delete member.", "error");
    }
}

async function moveMemberOrder(memberId, direction) {
    const department = activeTrack === "Leadership" ? "Leadership" : activeTrack;
    try {
        const result = await window.membersApi.updateMemberOrder(normalizeMemberId(memberId), direction, department);
        if (!result || !result.success) {
            showToast("Unable to update member order.", "error");
            return;
        }

        await window.membersApp.refreshMembers();

        // log details required by debugging
        console.log("Member order swap:", {
            memberId: result.currentMemberId,
            oldDisplayOrder: result.oldDisplayOrder,
            newDisplayOrder: result.newDisplayOrder,
            swappedMemberId: result.swappedMemberId
        });

        showToast("Member order updated.", "success");
    } catch (error) {
        console.error(error);
        showToast(error.message || "Unable to update member order.", "error");
    }
}

function previewSelectedImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const preview = document.getElementById("previewImage");
        if (preview) {
            preview.src = reader.result;
            preview.style.display = "block";
        }
    };
    reader.readAsDataURL(file);
}

async function initMembersUI() {
    if (uiInitialized) return;
    uiInitialized = true;

    bindEvents();
    attachModalCloseHandlers();
    const trackFilter = document.getElementById("trackFilters");
    if (trackFilter) renderTrackFilters(trackFilter);
    updateRoleOptions();
    resetForm();
}

window.membersUI = {
    initMembersUI,
    renderMembers,
    setMembers,
    setActiveTrack,
    setSearchTerm,
    resetForm,
    openMemberModal,
    requestDeleteMember,
    confirmDeleteMember
};

window.addEventListener("DOMContentLoaded", initMembersUI);
