// Website Achievements Loader
// Fetches and displays achievements from Supabase on the public website

async function loadWebsiteAchievements() {
  try {
    if (!window.supabaseClient) {
      console.warn("Supabase client not available for achievements");
      renderWebsiteAchievements([]);
      return;
    }

    const { data, error } = await window.supabaseClient
      .from("achievements")
      .select("*")
      .order("featured", { ascending: false })
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Failed to load achievements:", error);
      renderWebsiteAchievements([]);
      return;
    }

    renderWebsiteAchievements(data || []);
  } catch (error) {
    console.error("Achievements loader error:", error);
    renderWebsiteAchievements([]);
  }
}

async function renderWebsiteAchievements(achievements) {
  const container = document.querySelector(".ach-grid");
  if (!container) {
    console.error("Website achievements container .ach-grid not found");
    return;
  }

  if (!Array.isArray(achievements) || achievements.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--silver-dim);">
        No achievements available yet.
      </div>
    `;
    return;
  }

  const renderedCards = await Promise.all(achievements.map(async (achievement, index) => {
    console.log("Achievement:", achievement);
    console.log("Image URL:", achievement.image_url);

    let imageUrl = achievement.image_url || null;
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      try {
        const { data, error } = await window.supabaseClient.storage
          .from("achievements")
          .getPublicUrl(imageUrl);

        if (error) {
          console.error("Failed to generate public URL for achievement image:", error, imageUrl);
        } else if (data?.publicUrl) {
          imageUrl = data.publicUrl;
        }
      } catch (error) {
        console.error("Error generating public URL for achievement image:", error, imageUrl);
      }
    }

    const imageMarkup = imageUrl
      ? `<img src="${imageUrl}" alt="${achievement.title}" class="milestone-image">`
      : `<div class="ach-icon">🎯</div>`;

    return `
      <div class="ach-card reveal reveal-delay-${(index % 4) + 1}">
        ${imageMarkup}
        <h3 class="ach-title">${achievement.title}</h3>
        <p class="ach-desc">${achievement.description || "Achievement unlocked"}</p>
        <div class="ach-meta">${achievement.category || "Milestone"} · ${formatDate(achievement.event_date)}</div>
      </div>
    `;
  }));

  container.innerHTML = renderedCards.join("");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

// Load on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadWebsiteAchievements);
} else {
  loadWebsiteAchievements();
}
