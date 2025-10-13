// assets/js/admin-dashboard.js

// Use global supabase object from v2 library
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const userContainer = document.getElementById("usersContainer");
const txContainer = document.getElementById("transactionsContainer");
const logoutBtn = document.getElementById("logoutBtn");
const statusMsg = document.getElementById("dashboardMsg");

// Store data
let users = [];
let transactions = [];

// -------------------------
// Utility
// -------------------------
function showMessage(msg, type = "success") {
  if (!statusMsg) return;
  statusMsg.textContent = msg;
  statusMsg.style.color = type === "success" ? "green" : "red";
  setTimeout(() => (statusMsg.textContent = ""), 3000);
}

// -------------------------
// Auth & Admin check
// -------------------------
async function checkAdmin() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "./admin-login.html";
    return false;
  }

  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  if (adminError || !adminData) {
    await supabase.auth.signOut();
    window.location.href = "./admin-login.html";
    return false;
  }

  return true;
}

// -------------------------
// Fetch & Render Users
// -------------------------
async function fetchUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) return showMessage("Failed to load users", "error");

  users = data;
  renderUsers();
}

function renderUsers() {
  if (!userContainer) return;
  userContainer.innerHTML = "";

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "user-card";
    card.innerHTML = `
      <h4>${user.username || user.email}</h4>
      <p>Balance: $${Number(user.balance || 0).toFixed(2)}</p>
      <p>Status: ${user.isBanned ? "BANNED" : user.isFrozen ? "FROZEN" : "Active"}</p>
      <div class="card-actions">
        <button class="update-balance-btn" data-userid="${user.id}">Update Balance</button>
        <button class="toggle-ban-btn" data-userid="${user.id}">${user.isBanned ? "Unban" : "Ban"}</button>
        <button class="toggle-freeze-btn" data-userid="${user.id}">${user.isFrozen ? "Unfreeze" : "Freeze"}</button>
        <button class="delete-user-btn" data-userid="${user.id}">Delete</button>
      </div>
    `;
    userContainer.appendChild(card);
  });

  attachUserCardListeners();
}

// -------------------------
// User Actions
// -------------------------
function attachUserCardListeners() {
  document.querySelectorAll(".update-balance-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const newBalance = prompt("Enter new balance for user:");
      if (newBalance === null) return;

      const balanceNum = parseFloat(newBalance);
      if (isNaN(balanceNum) || balanceNum < 0) return alert("Invalid balance");

      const { error } = await supabase.from("users").update({ balance: balanceNum }).eq("id", userId);
      if (error) return showMessage("Failed to update balance", "error");
      showMessage("Balance updated");
      fetchUsers();
    });
  });

  document.querySelectorAll(".toggle-ban-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const user = users.find(u => u.id === userId);
      const { error } = await supabase.from("users").update({ isBanned: !user.isBanned }).eq("id", userId);
      if (error) return showMessage("Failed to toggle ban", "error");
      fetchUsers();
    });
  });

  document.querySelectorAll(".toggle-freeze-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const user = users.find(u => u.id === userId);
      const { error } = await supabase.from("users").update({ isFrozen: !user.isFrozen }).eq("id", userId);
      if (error) return showMessage("Failed to toggle freeze", "error");
      fetchUsers();
    });
  });

  document.querySelectorAll(".delete-user-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      if (!confirm("Are you sure you want to delete this user?")) return;

      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) return showMessage("Failed to delete user", "error");
      showMessage("User deleted");
      fetchUsers();
    });
  });
}

// -------------------------
// Fetch & Render Transactions
// -------------------------
async function fetchTransactions() {
  const { data, error } = await supabase.from("transactions").select("*").eq("status", "pending");
  if (error) return showMessage("Failed to load transactions", "error");

  transactions = data;
  renderTransactions();
}

function renderTransactions() {
  if (!txContainer) return;
  txContainer.innerHTML = "";

  transactions.forEach(tx => {
    const user = users.find(u => u.id === tx.userId);
    const card = document.createElement("div");
    card.className = "tx-card";
    card.innerHTML = `
      <h4>${user ? user.username || user.email : "Unknown"}</h4>
      <p>Type: ${tx.type}</p>
      <p>Amount: $${Number(tx.amount).toFixed(2)}</p>
      <div class="card-actions">
        <button class="approve-tx-btn" data-txid="${tx.id}">Approve</button>
        <button class="reject-tx-btn" data-txid="${tx.id}">Reject</button>
      </div>
    `;
    txContainer.appendChild(card);
  });

  attachTransactionListeners();
}

function attachTransactionListeners() {
  document.querySelectorAll(".approve-tx-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const txId = btn.dataset.txid;
      const tx = transactions.find(t => t.id === txId);
      if (!tx) return;

      const user = users.find(u => u.id === tx.userId);
      if (!user) return showMessage("User not found", "error");

      let newBalance = Number(user.balance);
      if (tx.type === "deposit") newBalance += Number(tx.amount);
      else if (tx.type === "withdrawal") {
        if (Number(tx.amount) > newBalance) return showMessage("Insufficient balance", "error");
        newBalance -= Number(tx.amount);
      }

      await supabase.from("users").update({ balance: newBalance }).eq("id", user.id);
      await supabase.from("transactions").update({ status: "approved" }).eq("id", txId);
      showMessage("Transaction approved");
      fetchUsers();
      fetchTransactions();
    });
  });

  document.querySelectorAll(".reject-tx-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const txId = btn.dataset.txid;
      await supabase.from("transactions").update({ status: "rejected" }).eq("id", txId);
      showMessage("Transaction rejected");
      fetchTransactions();
    });
  });
}

// -------------------------
// Logout
// -------------------------
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "./admin-login.html";
  });
}

// -------------------------
// Initialize Dashboard
// -------------------------
async function init() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return;

  await fetchUsers();
  await fetchTransactions();
}

init();