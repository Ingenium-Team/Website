(function () {
  const defaultSettings = {
    team_name: "Ingenium",
    motto: "Engineering the Future",
    hero_title: "Engineering the Future, Today.",
    hero_subtitle: "Ingenium is an elite student engineering team building real-world solutions, competing globally, and pushing the limits of what students can achieve.",
    about_paragraph: "Ingenium was founded with a single conviction: that students don't need to wait to make an impact.",
    founded_year: "2023",
    university: "Mansoura University",
    faculty: "Faculty of Engineering",
    email: "info@ingenium.com",
    phone: "+20 100 000 0000",
    whatsapp: "",
    address: "Mansoura, Egypt",
    google_maps_link: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    github: "",
    youtube: "",
    tiktok: "",
    discord: "",
    footer_text: "© 2026 Ingenium Engineering Team",
    footer_developed_by: "Ingenium Team",
    footer_description: "An elite student engineering team building real-world solutions.",
    website_title: "Ingenium Engineering Team",
    meta_description: "Ingenium is a student engineering team at Mansoura University building real-world solutions.",
    keywords: "Ingenium, engineering team, Mansoura University",
    primary_color: "#0D1B2A",
    secondary_color: "#C4753A",
    accent_color: "#E8EDF2",
    border_radius: "8px",
    font_family: "Inter, sans-serif",
    show_hero: "true",
    show_statistics: "true",
    show_direction: "true",
    show_achievements: "true",
    show_events: "true",
    show_gallery: "true",
    show_team: "true",
    show_sponsors: "true"
  };

  window.defaultWebsiteSettings = defaultSettings;

  function getSetting(key, fallback = "") {
    const value = window.siteSettingsCache?.[key];
    return value ?? fallback;
  }

  function isEnabled(key) {
    const value = getSetting(key, defaultSettings[key] || "true");
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function applyTheme() {
    try {
      const root = document.documentElement;
      if (!root) return;
      
      try { root.style.setProperty("--copper", getSetting("secondary_color", defaultSettings.secondary_color)); } catch (err) { console.warn("--copper failed:", err); }
      try { root.style.setProperty("--navy", getSetting("primary_color", defaultSettings.primary_color)); } catch (err) { console.warn("--navy failed:", err); }
      try { root.style.setProperty("--silver", getSetting("accent_color", defaultSettings.accent_color)); } catch (err) { console.warn("--silver failed:", err); }
      try { root.style.setProperty("--border-radius", getSetting("border_radius", defaultSettings.border_radius)); } catch (err) { console.warn("--border-radius failed:", err); }
      try { root.style.setProperty("--font-body", getSetting("font_family", defaultSettings.font_family)); } catch (err) { console.warn("--font-body failed:", err); }
    } catch (err) {
      console.warn("Theme application failed:", err);
    }
  }

  function applySeo() {
    try {
      try { document.title = getSetting("website_title", defaultSettings.website_title); } catch (err) { console.warn("Title update failed:", err); }
      
      try {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", getSetting("meta_description", defaultSettings.meta_description));
      } catch (err) { console.warn("Meta description failed:", err); }
      
      try {
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) metaKeywords.setAttribute("content", getSetting("keywords", defaultSettings.keywords));
      } catch (err) { console.warn("Meta keywords failed:", err); }
      
      try {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute("content", getSetting("website_title", defaultSettings.website_title));
      } catch (err) { console.warn("OG title failed:", err); }
      
      try {
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute("content", getSetting("meta_description", defaultSettings.meta_description));
      } catch (err) { console.warn("OG description failed:", err); }
    } catch (err) {
      console.warn("SEO application failed:", err);
    }
  }

  function applyContent() {
    try {
      // Safe: Only updating text/attributes of existing elements
      document.querySelectorAll('[data-setting-key]').forEach((element) => {
        try {
          const key = element.getAttribute("data-setting-key");
          const fallback = element.getAttribute("data-setting-fallback") || "";
          const value = getSetting(key, fallback);
          if (element.tagName === "IMG") {
            if (value) element.src = value;
          } else if (element.tagName === "A") {
            if (value) element.href = value;
            if (element.hasAttribute("data-setting-hide-empty") && !value) {
              element.style.display = "none";
            }
          } else if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.value = value;
          } else {
            element.textContent = value;
          }
        } catch (err) {
          console.warn("Failed to apply setting to element:", err);
        }
      });

      // Safe: Only updating src/href of existing elements
      const logo = document.getElementById("siteLogo");
      if (logo) {
        try {
          const logoSrc = getSetting("logo_url", "logo.png");
          if (logoSrc) logo.src = logoSrc;
        } catch (err) { console.warn("Logo update failed:", err); }
      }

      const favicon = document.getElementById("siteFavicon");
      if (favicon) {
        try {
          const faviconSrc = getSetting("favicon_url", "logo.png");
          if (faviconSrc) favicon.href = faviconSrc;
        } catch (err) { console.warn("Favicon update failed:", err); }
      }

      // Safe: Only updating text content of existing elements
      const heroEyebrow = document.getElementById("heroEyebrow");
      if (heroEyebrow) {
        try {
          heroEyebrow.textContent = getSetting("faculty", defaultSettings.faculty) + " · " + getSetting("university", defaultSettings.university);
        } catch (err) { console.warn("Hero eyebrow update failed:", err); }
      }

      const heroTitle = document.getElementById("heroTitle");
      if (heroTitle) {
        try {
          heroTitle.innerHTML = getSetting("hero_title", defaultSettings.hero_title).replace(/\n/g, "<br/>");
        } catch (err) { console.warn("Hero title update failed:", err); }
      }

      const heroSubtitle = document.getElementById("heroSubtitle");
      if (heroSubtitle) {
        try {
          heroSubtitle.textContent = getSetting("hero_subtitle", defaultSettings.hero_subtitle);
        } catch (err) { console.warn("Hero subtitle update failed:", err); }
      }

      const aboutParagraph = document.getElementById("aboutParagraph");
      if (aboutParagraph) {
        try {
          aboutParagraph.textContent = getSetting("about_paragraph", defaultSettings.about_paragraph);
        } catch (err) { console.warn("About paragraph update failed:", err); }
      }

      const footerCopy = document.getElementById("footerCopy");
      if (footerCopy) {
        try {
          footerCopy.innerHTML = getSetting("footer_text", defaultSettings.footer_text);
        } catch (err) { console.warn("Footer copy update failed:", err); }
      }

      const footerDesc = document.getElementById("footerDescription");
      if (footerDesc) {
        try {
          footerDesc.textContent = getSetting("footer_description", defaultSettings.footer_description);
        } catch (err) { console.warn("Footer description update failed:", err); }
      }

      const footerDevelopedBy = document.getElementById("footerDevelopedBy");
      if (footerDevelopedBy) {
        try {
          footerDevelopedBy.textContent = getSetting("footer_developed_by", defaultSettings.footer_developed_by);
        } catch (err) { console.warn("Footer developed by update failed:", err); }
      }

      const contactEmail = document.getElementById("contactEmail");
      if (contactEmail) {
        try {
          contactEmail.textContent = getSetting("email", defaultSettings.email);
        } catch (err) { console.warn("Contact email update failed:", err); }
      }

      const contactPhone = document.getElementById("contactPhone");
      if (contactPhone) {
        try {
          contactPhone.textContent = getSetting("phone", defaultSettings.phone);
        } catch (err) { console.warn("Contact phone update failed:", err); }
      }

      const contactAddress = document.getElementById("contactAddress");
      if (contactAddress) {
        try {
          contactAddress.textContent = getSetting("address", defaultSettings.address);
        } catch (err) { console.warn("Contact address update failed:", err); }
      }

      // Safe: Only updating href and display of existing elements
      const socialLinks = document.querySelectorAll("[data-social-link]");
      socialLinks.forEach((link) => {
        try {
          const key = link.getAttribute("data-social-link");
          const value = getSetting(key, "");
          if (!value) {
            link.style.display = "none";
          } else {
            link.setAttribute("href", value);
            link.style.display = "inline-flex";
          }
        } catch (err) { console.warn("Social link update failed:", err); }
      });

      // Safe: Only updating display property (CSS) of existing sections
      // VISIBILITY CONTROLS — Only hide if explicitly set to false
      // Default: all sections visible unless explicitly disabled via settings
      const visibilityTargets = [
        ["home", "show_hero", true],
        ["projects", "show_projects", true],
        ["achievements", "show_achievements", true],
        ["events", "show_events", true],
        ["gallery", "show_gallery", true],
        ["team", "show_team", true],
        ["about", "show_about", true],
        ["join", "show_join", true],
        ["contact", "show_contact", true]
      ];

      visibilityTargets.forEach(([id, key, defaultVisible]) => {
        try {
          const el = document.getElementById(id);
          if (!el) return;
          
          // Get the setting, defaulting to the provided default
          const shouldShow = getSetting(key) === "" 
            ? defaultVisible 
            : isEnabled(key);
          
          // IMPORTANT: Only set display property, never manipulate structure
          el.style.display = shouldShow ? (id === "home" ? "grid" : "block") : "none";
        } catch (err) { console.warn("Visibility update failed for " + id + ":", err); }
      });

    } catch (err) {
      console.error("Settings failed critical error:", err);
    }
  }

  async function initWebsiteSettings() {
    try {
      if (window.siteSettingsLoaded) {
        try {
          applyTheme();
          applySeo();
          applyContent();
        } catch (err) {
          console.error("Website settings application failed:", err);
        }
        return;
      }

      try {
        await window.settingsAPI.loadSettings();
      } catch (error) {
        console.warn("Failed to load settings from database, using defaults:", error);
        window.siteSettingsCache = {};
        window.siteSettingsLoaded = true;
      }

      try {
        applyTheme();
        applySeo();
        applyContent();
      } catch (err) {
        console.error("Website settings application failed:", err);
      }
    } catch (err) {
      console.error("Settings failed critical error:", err);
    }
  }

  window.initWebsiteSettings = initWebsiteSettings;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWebsiteSettings);
  } else {
    initWebsiteSettings();
  }
})();
