const modalRegistry = new Map();
const MODAL_OPEN_CLASS = "active";

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add(MODAL_OPEN_CLASS);
    document.body.classList.add("modal-open");
    modalRegistry.set(id, true);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove(MODAL_OPEN_CLASS);
    document.body.classList.remove("modal-open");
    modalRegistry.delete(id);
}

function attachModalCloseHandlers() {
    document.querySelectorAll("[data-modal-close]").forEach((button) => {
        button.addEventListener("click", () => closeModal(button.dataset.modalClose));
    });

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.attachModalCloseHandlers = attachModalCloseHandlers;
