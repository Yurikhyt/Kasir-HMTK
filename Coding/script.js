// STORAGE KEYS
let KEY_MENU = "kasir_menu_v1";
let KEY_USERS = "kasir_users_v1";
let KEY_HISTORY = "kasir_history_v1";
let KEY_SESSION = "kasir_current_user";

// LOAD DATA
let menu = JSON.parse(localStorage.getItem(KEY_MENU)) || [];
let users = JSON.parse(localStorage.getItem(KEY_USERS)) || [];
let historyData = JSON.parse(localStorage.getItem(KEY_HISTORY)) || [];
let cart = [];

/* ============================================================
   TOAST NOTIFICATION
============================================================ */
function notify(message, type = "info") {
    const cont = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "";
    if (type === "success") icon = "✔";
    if (type === "error") icon = "✖";
    if (type === "warning") icon = "⚠";
    if (type === "info") icon = "ℹ";

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
        <div class="toast-progress"></div>
    `;

    cont.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

/* ============================================================
   CONFIRM MODAL
============================================================ */
let confirmCallback = null;

function confirmModal(text, callback) {
    confirmCallback = callback;
    document.getElementById("confirmText").innerText = text;
    document.getElementById("confirmModal").classList.remove("hidden");
}

document.getElementById("confirmClose").onclick =
document.getElementById("confirmCancel").onclick = () => {
    document.getElementById("confirmModal").classList.add("hidden");
};

document.getElementById("confirmOK").onclick = () => {
    if (confirmCallback) confirmCallback();
    document.getElementById("confirmModal").classList.add("hidden");
};

/* ============================================================
   SAVE MENU
============================================================ */
function saveMenu() {
    localStorage.setItem(KEY_MENU, JSON.stringify(menu));
}

/* ============================================================
   FILTER MENU
============================================================ */
function filterMenu() {
    let f = document.getElementById("kategoriFilter").value;
    let box = document.getElementById("menuList");
    box.innerHTML = "";

    menu
        .filter(m => f === "semua" ? true : m.kategori === f)
        .forEach((m, i) => {
            let item = document.createElement("div");
            item.className = "menu-item";

            let catColor = m.kategori === "makanan" ? "#EEAC10" : "#083107";
            item.style.borderLeft = `6px solid ${catColor}`;

           item.innerHTML = `
    <strong style="display:block; margin-bottom:6px;">
        ${m.nama}
    </strong>

    <div class="category-tag ${m.kategori}" style="display:inline-flex; margin-bottom:10px;">
        ${m.kategori === "makanan" ? "🍽" : "🧃"}
        <span>${m.kategori.charAt(0).toUpperCase() + m.kategori.slice(1)}</span>
    </div>

    <div>
        Rp ${Number(m.harga).toLocaleString("id-ID")}<br>
        <span>Stok: ${m.stok}</span>
    </div>
`;



            item.onclick = () => addToCart(i);

            // delete
            let del = document.createElement("div");
            del.className = "menu-delete";
            del.textContent = "×";
            del.onclick = (e) => {
                e.stopPropagation();
                confirmModal("Hapus menu ini?", () => {
                    menu.splice(i, 1);
                    saveMenu();
                    filterMenu();
                    notify("Menu dihapus", "warning");
                });
            };

            // edit
            let edit = document.createElement("button");
            edit.textContent = "Edit";
            edit.className = "btn-primary";
            edit.style = "margin-top:8px; width:100%;";
            edit.onclick = (e) => {
                e.stopPropagation();
                openMenuModal("edit", i);
            };

            item.appendChild(del);
            item.appendChild(edit);
            box.appendChild(item);
        });
}

let editIndex = null;

document.getElementById("openAddMenu").onclick = () => openMenuModal("add");

function openMenuModal(mode, index = null) {
    editIndex = index;
    const modal = document.getElementById("menuModal");
    const title = document.getElementById("menuModalTitle");

    if (mode === "add") {
        title.textContent = "Tambah Menu";
        menuNama.value = "";
        menuHarga.value = "";
        menuStok.value = "";
        menuKategori.value = "makanan";
    } else {
        let m = menu[index];
        title.textContent = "Edit Menu";
        menuNama.value = m.nama;
        menuHarga.value = m.harga;
        menuStok.value = m.stok;
        menuKategori.value = m.kategori;
    }

    modal.classList.remove("hidden");
}

document.getElementById("closeMenuModal").onclick = () =>
    document.getElementById("menuModal").classList.add("hidden");

document.getElementById("saveMenuBtn").onclick = () => {
    let nama = menuNama.value.trim();
    let harga = parseInt(menuHarga.value);
    let stok = parseInt(menuStok.value);
    let kategori = menuKategori.value;

    if (!nama || isNaN(harga) || isNaN(stok)) {
        notify("Input tidak valid!", "error");
        return;
    }

    if (editIndex === null) {
        menu.push({ nama, harga, stok, kategori });
        notify("Menu ditambahkan", "success");
    } else {
        menu[editIndex] = { nama, harga, stok, kategori };
        notify("Menu diperbarui", "success");
    }

    saveMenu();
    filterMenu();
    menuModal.classList.add("hidden");
};

/* ============================================================
   CART
============================================================ */
function addToCart(i) {
    if (menu[i].stok <= 0) {
        notify("Stok habis!", "error");
        return;
    }

    // Kurangi stok
    menu[i].stok--;
    saveMenu();

    // CEK apakah item sudah ada di keranjang
    let exist = cart.find(c => c.index === i);

    if (exist) {
        exist.qty++;     // tambah qty
    } else {
        cart.push({
            index: i,
            nama: menu[i].nama,
            harga: menu[i].harga,
            qty: 1       // qty pertama kali
        });
    }

    filterMenu();
    renderCart();
}


function removeFromCart(i) {
    let item = cart[i];

    // kembalikan stok
    menu[item.index].stok++;
    saveMenu();

    // kurangi qty
    item.qty--;

    // jika qty habis → hapus
    if (item.qty <= 0) {
        cart.splice(i, 1);
    }

    renderCart();
    filterMenu();
}


function renderCart() {
    let box = document.getElementById("cartList");
    box.innerHTML = "";

    let total = 0;

    cart.forEach((c, i) => {
        total += c.harga * c.qty;

        let item = document.createElement("div");
        item.className = "cart-item";

        item.innerHTML = `
            <div class="cart-left">
                <strong>${c.nama}</strong>
                <span class="qty">x${c.qty}</span>
                <span class="harga">Rp ${(c.harga * c.qty).toLocaleString("id-ID")}</span>
            </div>

            <div class="cart-controls">
                <button class="qty-btn minus" data-id="${i}">–</button>
                <button class="qty-btn plus" data-id="${i}">+</button>
                <button class="remove-cart-btn" data-id="${i}">❌</button>
            </div>
        `;

        box.appendChild(item);
    });

    // BTN +
    document.querySelectorAll(".plus").forEach(btn => {
        btn.onclick = () => {
            let i = btn.getAttribute("data-id");
            cart[i].qty++;
            menu[cart[i].index].stok--;
            saveMenu();
            renderCart();
            filterMenu();
        };
    });

    // BTN –
    document.querySelectorAll(".minus").forEach(btn => {
        btn.onclick = () => {
            let i = btn.getAttribute("data-id");
            removeFromCart(i);
        };
    });

   
    document.querySelectorAll(".remove-cart-btn").forEach(btn => {
        btn.onclick = () => {
            let i = btn.getAttribute("data-id");
            menu[cart[i].index].stok += cart[i].qty;  // kembalikan semua stok
            cart.splice(i, 1);
            saveMenu();
            renderCart();
            filterMenu();
        };
    });

    document.getElementById("totalHarga").textContent = total;
}

document.getElementById("payBtn").onclick = () => {
    if (!cart.length) return notify("Keranjang kosong!", "error");

    let total = cart.reduce((a, b) => a + (b.harga * b.qty), 0);

    confirmModal(`Bayar Rp${total}?`, () => {
        historyData.push({
            tanggal: new Date().toLocaleString(),
            total,
            metode: "Tunai",
            items: [...cart]
        });

        localStorage.setItem(KEY_HISTORY, JSON.stringify(historyData));

        cart = [];
        renderCart();

        notify("Pembayaran berhasil!", "success");
    });
};

/* ============================================================
   USER MANAGEMENT
============================================================ */
document.getElementById("manageUsersBtn").onclick = () => {
    document.getElementById("manageUsersModal").classList.remove("hidden");
    renderUsers();
};

document.getElementById("closeManageUsers").onclick = () =>
    document.getElementById("manageUsersModal").classList.add("hidden");

function renderUsers() {
    const box = document.getElementById("usersList");
    box.innerHTML = "";

    if (users.length === 0) {
        box.innerHTML = `
            <p style="text-align:center; color:#666; padding:10px;">
                Belum ada user.
            </p>`;
        return;
    }

    users.forEach((u, i) => {
        const row = document.createElement("div");
        row.style = `
            display:flex;
            justify-content:space-between;
            align-items:center;
            background:#fff;
            padding:12px;
            margin-bottom:8px;
            border-radius:8px;
            box-shadow:0 2px 6px rgba(0,0,0,0.1);
        `;

        row.innerHTML = `
            <div>
                <strong>${u.username}</strong>
                <div style="font-size:13px;color:#666;">Role: ${u.role}</div>
            </div>
            <button data-del="${i}" class="btn-danger" style="padding:6px 10px;">
                Hapus
            </button>
        `;

        box.appendChild(row);
    });

    document.querySelectorAll("[data-del]").forEach(btn => {
        btn.onclick = () => {
            let index = btn.getAttribute("data-del");

            confirmModal("Hapus user ini?", () => {
                users.splice(index, 1);
                localStorage.setItem(KEY_USERS, JSON.stringify(users));
                renderUsers();
                notify("User dihapus", "warning");
            });
        };
    });
}

document.getElementById("addUserBtn").onclick = () => {
    let username = document.getElementById("newUsername").value.trim();
    let password = document.getElementById("newPassword").value.trim();
    let role = document.getElementById("newRole").value;

    if (!username || !password) {
        notify("Isi semua data!", "error");
        return;
    }

    users.push({ username, password, role });
    localStorage.setItem(KEY_USERS, JSON.stringify(users));

    document.getElementById("newUsername").value = "";
    document.getElementById("newPassword").value = "";

    notify("User ditambahkan!", "success");
    renderUsers();
};

/* ============================================================
   INIT
============================================================ */
filterMenu();
renderCart();

// ENTER NAVIGATION
document.getElementById("menuNama").addEventListener("keydown", (e) => {
    if (e.key === "Enter") menuHarga.focus();
});

document.getElementById("menuHarga").addEventListener("keydown", (e) => {
    if (e.key === "Enter") menuStok.focus();
});

document.getElementById("menuStok").addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveMenuBtn.click();
});

// FILTER EVENT LISTENER
document.getElementById("kategoriFilter")
    .addEventListener("change", filterMenu);

    btn.onclick = () => {
    let i = btn.getAttribute("data-id");

    if(menu[cart[i].index].stok <= 0){
        notify("Stok habis!", "error");
        return;
    }

    cart[i].qty++;
    menu[cart[i].index].stok--;
    saveMenu();
    renderCart();
    filterMenu();
};
