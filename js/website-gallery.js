async function loadWebsiteGallery() {
  try {
    if (!window.supabaseClient) {
      console.warn("Supabase client not available for gallery");
      renderWebsiteGallery([]);
      return;
    }

    const { data, error } = await window.supabaseClient
      .from("gallery")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Failed to load gallery:", error);
      renderWebsiteGallery([]);
      return;
    }

    renderWebsiteGallery(data || []);
  } catch (error) {
    console.error("Gallery loader error:", error);
    renderWebsiteGallery([]);
  }
}

function renderWebsiteGallery(items) {
  const container = document.querySelector(".gallery-grid");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">No gallery images yet.</div>`;
    return;
  }

  container.innerHTML = items
    .map((item) => `
      <article class="gallery-card reveal">
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.title || "Gallery image"}" class="gallery-image">` : ""}
        <div class="gallery-card-body">
          <h3>${item.title || "Gallery Image"}</h3>
          ${item.description ? `<p>${item.description}</p>` : ""}
          ${item.album ? `<span class="gallery-album">${item.album}</span>` : ""}
        </div>
      </article>
    `)
    .join("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadWebsiteGallery);
} else {
  loadWebsiteGallery();
}

window.loadWebsiteGallery = loadWebsiteGallery;
