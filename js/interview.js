const interviewState = {
    slots: [],
    selectedSlot: null,
    committeeSelect: null,
    loadSlotsBtn: null,
    bookingForm: null,
    slotsContainer: null,
    slotLoading: null,
    slotEmptyState: null,
    bookingConfirmation: null,
    selectedSlotSummary: null
};

function formatDateLabel(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
    }).format(date);
}

function formatTimeLabel(timeValue) {
    if (!timeValue) {
        return "Time unavailable";
    }

    const [hours, minutes] = timeValue.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

function formatSlotRange(slot) {
    return `${formatTimeLabel(slot.start_time)} — ${formatTimeLabel(slot.end_time)}`;
}

function formatCommitteeLabel(committee) {
    if (!committee) return "Unassigned";
    return committee.charAt(0).toUpperCase() + committee.slice(1);
}

async function loadAvailableSlots() {
    if (!window.supabaseClient) {
        showToast("Supabase client is unavailable.", "error");
        return;
    }

    const selectedCommittee = interviewState.committeeSelect?.value;
    if (!selectedCommittee) {
        interviewState.slots = [];
        interviewState.slotLoading.classList.add("hidden");
        interviewState.slotEmptyState.classList.add("hidden");
        interviewState.slotsContainer.innerHTML = "";
        return;
    }

    interviewState.slotLoading.textContent = `Loading ${formatCommitteeLabel(selectedCommittee)} interview slots...`;
    interviewState.slotLoading.classList.remove("hidden");

    try {
        const { data, error } = await window.supabaseClient
            .from("interview_slots")
            .select("id, interview_date, start_time, end_time, status, committee")
            .eq("status", "available")
            .eq("committee", selectedCommittee)
            .order("interview_date", { ascending: true })
            .order("start_time", { ascending: true });

        if (error) {
            throw error;
        }

        interviewState.slots = data || [];
        renderSlots();
    } catch (error) {
        console.error("Failed to load interview slots:", error);
        showToast("Unable to load available interview slots.", "error");
        interviewState.slotLoading.textContent = "Unable to load interview slots right now.";
    }
}

function renderSlots() {
    interviewState.slotLoading.classList.add("hidden");

    const grouped = interviewState.slots.reduce((acc, slot) => {
        const key = slot.interview_date;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(slot);
        return acc;
    }, {});

    if (!interviewState.slots.length) {
        interviewState.slotEmptyState.classList.remove("hidden");
        interviewState.slotEmptyState.textContent = `No available interview slots for this committee at the moment.`;
        interviewState.slotsContainer.innerHTML = "";
        return;
    }

    interviewState.slotEmptyState.classList.add("hidden");
    interviewState.slotsContainer.innerHTML = Object.entries(grouped)
        .map(([date, slots]) => `
            <div class="slot-day">
                <h3>${formatDateLabel(date)}</h3>
                <div class="slot-list">
                    ${slots.map((slot) => `
                        <div class="slot-card">
                            <div class="slot-meta">
                                <span class="slot-time">${formatSlotRange(slot)}</span>
                                <span class="slot-status">Available</span>
                            </div>
                            <button class="slot-select" type="button" data-slot-id="${slot.id}">Choose</button>
                        </div>
                    `).join("")}
                </div>
            </div>
        `)
        .join("");

    interviewState.slotsContainer.querySelectorAll("[data-slot-id]").forEach((button) => {
        button.addEventListener("click", () => openBookingModal(button.dataset.slotId));
    });
}

function openBookingModal(slotId) {
    interviewState.selectedSlot = interviewState.slots.find((slot) => slot.id === slotId);
    if (!interviewState.selectedSlot) {
        showToast("This interview slot could not be found.", "error");
        return;
    }

    if (interviewState.selectedSlot.committee !== interviewState.committeeSelect?.value) {
        showToast("This interview slot does not belong to the selected committee.", "error");
        return;
    }

    const publicName = document.getElementById("publicApplicantName")?.value.trim();
    const publicEmail = document.getElementById("publicApplicantEmail")?.value.trim();
    const publicPhone = document.getElementById("publicApplicantPhone")?.value.trim();
    const publicNotes = document.getElementById("publicApplicantNotes")?.value.trim();

    if (publicName) document.getElementById("applicantName").value = publicName;
    if (publicEmail) document.getElementById("applicantEmail").value = publicEmail;
    if (publicPhone) document.getElementById("applicantPhone").value = publicPhone;
    if (publicNotes) document.getElementById("applicantNotes").value = publicNotes;

    const summary = `${formatCommitteeLabel(interviewState.selectedSlot.committee)} • ${formatDateLabel(interviewState.selectedSlot.interview_date)} • ${formatSlotRange(interviewState.selectedSlot)}`;
    interviewState.selectedSlotSummary.innerHTML = `<strong>${summary}</strong>`;
    window.openModal("interviewBookingModal");
}

function validateBookingForm() {
    const name = document.getElementById("publicApplicantName")?.value.trim() || document.getElementById("applicantName")?.value.trim();
    const email = document.getElementById("publicApplicantEmail")?.value.trim() || document.getElementById("applicantEmail")?.value.trim();
    const phone = document.getElementById("publicApplicantPhone")?.value.trim() || document.getElementById("applicantPhone")?.value.trim();
    const notes = document.getElementById("publicApplicantNotes")?.value.trim() || document.getElementById("applicantNotes")?.value.trim();

    if (!name) {
        showToast("Full name is required.", "error");
        return null;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showToast("A valid email address is required.", "error");
        return null;
    }

    if (!phone) {
        showToast("Phone number is required.", "error");
        return null;
    }

    return { name, email, phone, notes };
}

async function submitBooking(event) {
    event.preventDefault();

    const selectedCommittee = interviewState.committeeSelect?.value;
    if (!selectedCommittee) {
        showToast("Please select a committee first.", "error");
        return;
    }

    if (!interviewState.selectedSlot) {
        showToast("Please choose an interview slot first.", "error");
        return;
    }

    const slotCommitteeMatch = interviewState.selectedSlot.committee === selectedCommittee;
    if (!slotCommitteeMatch) {
        showToast("The selected slot does not belong to the selected committee.", "error");
        return;
    }

    const bookingDetails = validateBookingForm();
    if (!bookingDetails) {
        return;
    }

    try {
        const { error } = await window.supabaseClient.rpc("book_interview_slot", {
            p_slot_id: interviewState.selectedSlot.id,
            p_applicant_name: bookingDetails.name,
            p_applicant_email: bookingDetails.email,
            p_applicant_phone: bookingDetails.phone,
            p_notes: bookingDetails.notes
        });

        if (error) {
            const message = String(error.message || "").toLowerCase();
            if (message.includes("already") || message.includes("available") || message.includes("booked")) {
                showToast("This interview slot is no longer available. Please choose another time.", "error");
                window.closeModal("interviewBookingModal");
                await loadAvailableSlots();
                return;
            }

            throw error;
        }

        window.closeModal("interviewBookingModal");
        showToast("Interview Booked Successfully", "success");
        renderConfirmation(bookingDetails);
        await loadAvailableSlots();
    } catch (error) {
        console.error("Booking failed:", error);
        showToast("Unable to book this interview slot right now.", "error");
    }
}

function renderConfirmation(bookingDetails) {
    document.getElementById("confirmationName").textContent = bookingDetails.name;
    document.getElementById("confirmationDate").textContent = formatDateLabel(interviewState.selectedSlot.interview_date);
    document.getElementById("confirmationTime").textContent = formatSlotRange(interviewState.selectedSlot);
    document.getElementById("confirmationEmail").textContent = bookingDetails.email;
    interviewState.bookingConfirmation.classList.remove("hidden");
}

function bindEvents() {
    interviewState.bookingForm.addEventListener("submit", submitBooking);
    interviewState.loadSlotsBtn.addEventListener("click", () => {
        const name = document.getElementById("publicApplicantName")?.value.trim();
        const email = document.getElementById("publicApplicantEmail")?.value.trim();
        const phone = document.getElementById("publicApplicantPhone")?.value.trim();

        if (!interviewState.committeeSelect.value) {
            showToast("Please select a committee before showing slots.", "error");
            return;
        }

        if (!name || !email || !phone) {
            showToast("Please complete your name, email, and phone before viewing slots.", "error");
            return;
        }

        interviewState.selectedSlot = null;
        loadAvailableSlots();
    });
    interviewState.committeeSelect.addEventListener("change", () => {
        interviewState.selectedSlot = null;
        interviewState.slots = [];
        interviewState.slotLoading.classList.add("hidden");
        interviewState.slotEmptyState.classList.add("hidden");
        interviewState.slotsContainer.innerHTML = "";
    });
    document.querySelectorAll("[data-modal-close='interviewBookingModal']").forEach((button) => {
        button.addEventListener("click", () => {
            interviewState.bookingForm.reset();
        });
    });
}

function initInterviewPage() {
    interviewState.committeeSelect = document.getElementById("committeeSelect");
    interviewState.loadSlotsBtn = document.getElementById("loadSlotsBtn");
    interviewState.bookingForm = document.getElementById("bookingForm");
    interviewState.slotsContainer = document.getElementById("slotsContainer");
    interviewState.slotLoading = document.getElementById("slotLoading");
    interviewState.slotEmptyState = document.getElementById("slotEmptyState");
    interviewState.bookingConfirmation = document.getElementById("bookingConfirmation");
    interviewState.selectedSlotSummary = document.getElementById("selectedSlotSummary");

    if (!interviewState.committeeSelect || !interviewState.loadSlotsBtn || !interviewState.bookingForm || !interviewState.slotsContainer || !interviewState.slotLoading || !interviewState.slotEmptyState || !interviewState.bookingConfirmation || !interviewState.selectedSlotSummary) {
        return;
    }

    bindEvents();
    attachModalCloseHandlers();
}

window.addEventListener("DOMContentLoaded", initInterviewPage);
