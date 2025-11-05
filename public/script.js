// ──────────────────────────────────────────────────────────────
// 1. DOM References & Global State
// ──────────────────────────────────────────────────────────────
const clientForm   = document.getElementById("clientForm");
const clientsTbody = document.getElementById("clientsTbody");
const clientCount  = document.getElementById("clientCount");
const notif        = document.getElementById("notif");
const searchInput  = document.getElementById("searchInput");
const emptyState   = document.getElementById("emptyState");
const resetBtn     = document.getElementById("resetBtn");
const yearEl       = document.getElementById("year");

let allClients = [];   // Holds the full list from the server
let editMode   = false; // Not used right now – kept for future extensions


// ──────────────────────────────────────────────────────────────
// 2. Footer Year (dynamic)
// ──────────────────────────────────────────────────────────────
yearEl.textContent = new Date().getFullYear();

// ──────────────────────────────────────────────────────────────
// 3. Notification Helper
// ──────────────────────────────────────────────────────────────
function showNotification(message, type = "success") {
  notif.textContent = message;
  notif.className   = `notification ${type}`;
  notif.hidden      = false;
  setTimeout(() => (notif.hidden = true), 3000);
}

// ──────────────────────────────────────────────────────────────
// 4. Fetch All Clients
// ──────────────────────────────────────────────────────────────
async function fetchClients() {
  try {
    const res = await fetch("/api/clients");
    if (!res.ok) throw new Error("Failed to fetch clients");
    allClients = await res.json();
    renderClients(allClients);
  } catch (err) {
    showNotification(err.message, "error");
  }
}

// ──────────────────────────────────────────────────────────────
// 5. Render Clients Table
// ──────────────────────────────────────────────────────────────
function renderClients(clients) {
  clientsTbody.innerHTML = "";
  if (!clients.length) {
    emptyState.hidden = false;
    clientCount.textContent = 0;
    return;
  }
  emptyState.hidden = true;

  clients.forEach((client) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${client.name}</td>
      <td>${client.phone}</td>
      <td>R${parseFloat(client.balance || 0).toFixed(2)}</td>
      <td>${client.workplace || "-"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn edit" aria-label="Edit client" data-id="${client.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          </button>
          <button class="icon-btn delete" aria-label="Delete client" data-id="${client.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6 17.91 19.84A2 2 0 0 1 15.91 22H8.09a2 2 0 0 1-1.99-2.16L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    clientsTbody.appendChild(tr);
  });

  clientCount.textContent = clients.length;

  // Bind action buttons
  document.querySelectorAll(".icon-btn.edit").forEach((btn) =>
    btn.addEventListener("click", () => editClient(btn.dataset.id))
  );
  document.querySelectorAll(".icon-btn.delete").forEach((btn) =>
    btn.addEventListener("click", () => deleteClient(btn.dataset.id))
  );
}

// ──────────────────────────────────────────────────────────────
// 6. Form Submit – Add / Update
// ──────────────────────────────────────────────────────────────
clientForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id        = document.getElementById("clientId").value;
  const name      = document.getElementById("name").value.trim();
  const phone     = document.getElementById("phone").value.trim();
  const balance   = document.getElementById("amountOwed").value.trim();
  const workplace = document.getElementById("workplace").value.trim();

  if (!name || !phone || balance === "") {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  const clientData = {
    name,
    phone,
    balance: parseFloat(balance),
    workplace,
  };

  try {
    const method = id ? "PUT" : "POST";
    const url    = id ? `/api/clients/${id}` : "/api/clients";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });

    if (!res.ok) throw new Error("Failed to save client");

    await fetchClients();
    clientForm.reset();
    document.getElementById("clientId").value = "";
    document.getElementById("formTitle").textContent = "Add Client";
    showNotification(id ? "Client updated successfully" : "Client added successfully");
  } catch (err) {
    showNotification(err.message, "error");
  }
});

// ──────────────────────────────────────────────────────────────
// 7. Edit Client (populate form)
// ──────────────────────────────────────────────────────────────
function editClient(id) {
  const client = allClients.find((c) => c.id == id);
  if (!client) return;

  document.getElementById("clientId").value     = client.id;
  document.getElementById("name").value         = client.name;
  document.getElementById("phone").value        = client.phone;
  document.getElementById("amountOwed").value   = client.balance;
  document.getElementById("workplace").value    = client.workplace || "";

  document.getElementById("formTitle").textContent = "Edit Client";
  showNotification("Editing client...", "success");
}

// ──────────────────────────────────────────────────────────────
// 8. Delete Client
// ──────────────────────────────────────────────────────────────
async function deleteClient(id) {
  if (!confirm("Delete this client?")) return;

  try {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete client");

    showNotification("Client deleted successfully");
    await fetchClients();
  } catch (err) {
    showNotification(err.message, "error");
  }
}

// ──────────────────────────────────────────────────────────────
// 9. Reset Form Button
// ──────────────────────────────────────────────────────────────
resetBtn.addEventListener("click", () => {
  clientForm.reset();
  document.getElementById("clientId").value = "";
  document.getElementById("formTitle").textContent = "Add Client";
});

// ──────────────────────────────────────────────────────────────
// 10. Search (debounced for smoother UX)
// ──────────────────────────────────────────────────────────────
let searchTimeout;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = e.target.value.toLowerCase();
    const filtered = allClients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.workplace && c.workplace.toLowerCase().includes(query))
    );
    renderClients(filtered);
  }, 250);
});

// ──────────────────────────────────────────────────────────────
// 11. Initial Load
// ──────────────────────────────────────────────────────────────
fetchClients();