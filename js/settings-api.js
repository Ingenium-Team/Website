(function () {
  const SETTINGS_TABLE = "site_settings";
  const cache = {};
  let cacheLoaded = false;

  function normalizeValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "boolean") return value;
    return String(value);
  }

  async function loadSettings() {
    if (cacheLoaded && Object.keys(cache).length) {
      return { ...cache };
    }

    if (!window.supabaseClient) {
      window.siteSettingsCache = cache;
      window.siteSettingsLoaded = true;
      return {};
    }

    const { data, error } = await window.supabaseClient
      .from(SETTINGS_TABLE)
      .select("key, value, type")
      .order("updated_at", { ascending: false });

    if (error) {
      if (String(error.message || "").includes("does not exist") || String(error.message || "").includes("relation")) {
        window.siteSettingsCache = cache;
        window.siteSettingsLoaded = true;
        return {};
      }
      throw error;
    }

    const settings = {};
    (data || []).forEach((entry) => {
      settings[entry.key] = entry.value;
    });

    Object.keys(cache).forEach((key) => delete cache[key]);
    Object.assign(cache, settings);
    cacheLoaded = true;
    window.siteSettingsCache = cache;
    window.siteSettingsLoaded = true;
    return { ...cache };
  }

  function getSetting(key, fallback = null) {
    if (Object.prototype.hasOwnProperty.call(cache, key)) {
      return cache[key];
    }
    return fallback;
  }

  function setSetting(key, value) {
    cache[key] = normalizeValue(value);
    window.siteSettingsCache = cache;
    return cache[key];
  }

  async function saveSetting(key, value, type = "text") {
    const normalizedValue = normalizeValue(value);
    const { error } = await window.supabaseClient.from(SETTINGS_TABLE).upsert(
      {
        key,
        value: normalizedValue,
        type,
        updated_at: new Date().toISOString()
      },
      { onConflict: "key" }
    );

    if (error) throw error;
    setSetting(key, normalizedValue);
    return normalizedValue;
  }

  async function saveAllSettings(values) {
    const entries = Object.entries(values).map(([key, value]) => ({
      key,
      value: normalizeValue(value),
      type: "text",
      updated_at: new Date().toISOString()
    }));

    const { error } = await window.supabaseClient.from(SETTINGS_TABLE).upsert(entries, {
      onConflict: "key"
    });

    if (error) throw error;
    entries.forEach((entry) => setSetting(entry.key, entry.value));
    return entries;
  }

  async function uploadSettingImage(file, key) {
    if (!file) return null;

    const fileName = `${Date.now()}-${key}-${file.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await window.supabaseClient.storage.from("settings").upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      throw uploadError;
    }

    const { data } = window.supabaseClient.storage.from("settings").getPublicUrl(fileName);
    return data.publicUrl;
  }

  window.settingsAPI = {
    loadSettings,
    saveSetting,
    saveAllSettings,
    uploadSettingImage,
    getSetting,
    setSetting
  };
})();
