// Website Events Loader
// Fetches and displays events from Supabase on the public website

async function loadWebsiteEvents() {
  try {
    if (!window.supabaseClient) {
      console.warn("Supabase client not available for events");
      renderWebsiteEvents([]);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    
    const { data, error } = await window.supabaseClient
      .from("events")
      .select("*")
      .gte("event_date", today)
      .eq("visible", true)
      .eq("featured", true)
      .order("display_order", { ascending: true })
      .limit(6);

    if (error) {
      console.error("Failed to load events:", error);
      renderWebsiteEvents([]);
      return;
    }

    renderWebsiteEvents(data || []);
  } catch (error) {
    console.error("Events loader error:", error);
    renderWebsiteEvents([]);
  }
}

function renderWebsiteEvents(events) {
  const container = document.querySelector(".events-grid");
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--silver-dim);">
        No upcoming events scheduled.
      </div>
    `;
    return;
  }

  container.innerHTML = events
    .map((event, index) => `
      <article class="event-card reveal reveal-delay-${(index % 3) + 1}">
        ${event.image_url ? `<div class="event-thumb" style="background-image: url('${event.image_url}');"></div>` : `<div class="event-thumb" style="display: flex; align-items: center; justify-content: center; background: var(--navy);"><span style="font-size: 2rem;">📅</span></div>`}
        <div class="event-body">
          <span class="event-status">Upcoming</span>
          <h3 class="event-name">${event.title}</h3>
          <p class="event-desc">${event.description || "Event details"}</p>
          <div class="event-details">
            <div>📅 ${formatEventDate(event.event_date)}</div>
            ${event.event_time ? `<div>⏰ ${event.event_time}</div>` : ""}
            ${event.location ? `<div>📍 ${event.location}</div>` : ""}
          </div>
          ${event.registration_url ? `<a href="${event.registration_url}" target="_blank" class="event-link">Register Now →</a>` : ""}
        </div>
      </article>
    `)
    .join("");
}

function formatEventDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Load on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadWebsiteEvents);
} else {
  loadWebsiteEvents();
}
