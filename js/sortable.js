let sortableInstance = null;

function initSortable() {
    const grid = document.getElementById("membersGrid");
    if (!grid || sortableInstance) return;

    sortableInstance = new Sortable(grid, {
        animation: 220,
        handle: ".drag-handle",
        ghostClass: "is-dragging",
        draggable: ".member-card",
        onEnd: async () => {
            const memberIds = Array.from(grid.querySelectorAll(".member-card")).map((card) => card.dataset.id);
            try {
                const result = await window.membersApi.updateMemberOrder(memberIds);
                if (!result || !result.success) {
                    showToast("Unable to update member order.", "error");
                    return;
                }
                await window.membersApp.refreshMembers();
                showToast("Member order updated.", "success");
            } catch (error) {
                console.error(error);
                showToast("Unable to update member order.", "error");
            }
        }
    });
}

window.initSortable = initSortable;
