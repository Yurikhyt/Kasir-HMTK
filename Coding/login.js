async function hash(txt) {
    const enc = new TextEncoder().encode(txt);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function doLogin() {
    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();
    if (!user || !pass) return alert("Isi username dan password");

    const users = JSON.parse(localStorage.getItem("kasir_users_v1")) || [];
    const hashed = await hash(pass);
    const found = users.find(u => u.username === user && u.password === hashed);

    if (!found) return alert("Username atau password salah");

    localStorage.setItem("kasir_current_user", JSON.stringify(found));
    window.location.href = "kasir.html";
}
loginPass.addEventListener("keydown", async function(e) {
    if (e.key === "Enter") {
        await doLogin();
    }
});

loginUser.addEventListener("keydown", async function(e) {
    if (e.key === "Enter") {
        loginPass.focus();
    }
});
