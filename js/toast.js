let toastId = 0;

function createToast(message, type = "success") {
    const container = document.querySelector(".toast-container") || createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" type="button" aria-label="Close">×</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => removeToast(toast));
    container.appendChild(toast);

    window.setTimeout(() => removeToast(toast), 3200);
    return toast;
}

function createToastContainer() {
    const container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
}

function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.opacity = "0";
    window.setTimeout(() => toast.remove(), 180);
}

window.showToast = (message, type = "success") => createToast(message, type);
