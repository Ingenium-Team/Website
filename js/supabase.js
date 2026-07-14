const SUPABASE_URL = "https://ectgevydafkosrarnclr.supabase.co";
const SUPABASE_KEY = "sb_publishable_G-8lMbxKgoMMxAcd5hOsBg_dz4v_Jt-";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.supabaseClient = supabaseClient;

console.log("✅ Supabase Connected");
console.log(supabaseClient);