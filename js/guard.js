async function checkAuth() {

    // هل المستخدم مسجل دخول؟
    const { data: authData, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !authData.user) {
        window.location.href = "login.html";
        return;
    }

    // هات بياناته من جدول profiles
    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", authData.user.id)
        .single();

    if (profileError) {
    console.error(profileError);
    alert(profileError.message);
    return;
}

    // الأدوار المسموح لها
    const allowedRoles = [
        "Team Leader",
        "Vice Team Leader",
        "Technical Head",
        "HR Head",
        "PR Head",
        "Board"
    ];

    if (!allowedRoles.includes(profile.role)) {
        alert("Access Denied");
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
        return;
    }

    // عرض اسم المستخدم في الكونسول مؤقتًا
    console.log(profile);

}