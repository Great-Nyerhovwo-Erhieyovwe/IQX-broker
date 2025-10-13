// assets/js/admin-dashboard.js

// Use global supabase object from v2 library
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI';

// FIX 2: Correctly initializing the Supabase client.
const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// The main body element for theme control
const body = document.body;

// DOM elements for general dashboard operations
const statusMsg = document.getElementById("dashboardMsg");
const logoutBtn = document.getElementById("logout-btn"); // Updated ID to match HTML snippet

// ======= Dashboard UI Controls (New) =======
const dashboardContainer = document.getElementById('dashboard-container');
const sidebarToggleBtn = document.getElementById('sidebar-toggle');
const themeToggleBtn = document.getElementById('theme-toggle');
// New: Profile Dropdown Elements
const profileDropdownContainer = document.getElementById('profile-dropdown');
// The menu element itself
const profileDropdownMenu = profileDropdownContainer?.querySelector('.dropdown-menu'); 


// ======= Overview Module DOM elements (Optional page-specific elements) =======
const overviewUserContainer = document.getElementById("usersContainer");
const txContainer = document.getElementById("transactionsContainer");


// ====== Wallet JS Module - Primary User List (Filterable - Optional page-specific elements) ======
const walletUserContainer = document.getElementById('users-cards-container');
const searchInput = document.getElementById('wallet-search');
const accountFilter = document.getElementById('account-type-filter')
const verificationFilter = document.getElementById('verification-filter')


// ===== Wallet Modal Module (Optional page-specific elements) =====
const walletModal = document.getElementById('wallet-modal');
const modalUserTitle = document.getElementById('modal-user-title');
const modalUidInput = document.getElementById('modal-user-uid');
const modalWalletInput = document.getElementById('modal-wallet-address');
const modalAccountSelect = document.getElementById('modal-account-type');
const modalVerificationSelect = document.getElementById('modal-verification-status');
const walletModalForm = document.getElementById('wallet-verification-form');
const modalCloseBtn = walletModal?.querySelector('.close-btn'); // Use optional chaining


// ======= Manage User Module - Balance/Status Update Modal (Optional page-specific elements) =======
const statusFilter = document.getElementById('status-filter');

const actionModal = document.getElementById('action-modal');
const actionModalUserId = document.getElementById('modal-user-id');
const newBalanceInput = document.getElementById('new-balance');
const balanceActionSelect = document.getElementById('balance-action');
const accountStatusSelect = document.getElementById('account-status');
const balanceActionForm = document.getElementById('balance-action-form'); 

// Store data
let allUsers = []; 
let transactions = [];

// -------------------------
// Utility
// -------------------------
function showMessage(msg, type = "success") {
  if (!statusMsg) return;
  statusMsg.textContent = msg;
  // Added Tailwind classes for better visibility of success/error messages
  statusMsg.className = `p-2 my-2 rounded text-center text-sm ${type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`;
  setTimeout(() => {
    statusMsg.textContent = "";
    statusMsg.className = "";
  }, 3000);
}

// Replacement for blocking window.confirm().
function showConfirmation(msg) {
    console.warn(`[CONFIRMATION REQUIRED] User prompt: ${msg}`);
    // FIX: Using a non-blocking prompt/alert is better practice in UI
    // but sticking to window.confirm for now as per previous pattern.
    return window.confirm(msg);
}


// -------------------------
// UI/Sidebar & Theme Logic (New)
// -------------------------
function setupUILogic() {
    // 1. Initial Theme Setup
    if (body) {
        const currentTheme = localStorage.getItem('theme') || 'light-mode';
        body.classList.remove('loading'); 
        body.classList.add(currentTheme);
    }
    
    // 2. Sidebar Toggle (Hamburger Button)
    if (sidebarToggleBtn && dashboardContainer) {
        sidebarToggleBtn.addEventListener('click', () => {
            dashboardContainer.classList.toggle('sidebar-collapsed');
        });
    }

    // 3. Theme Toggle Button
    if (themeToggleBtn && body) {
        themeToggleBtn.addEventListener('click', () => {
            const isDarkMode = body.classList.contains('dark-mode');
            
            body.classList.remove(isDarkMode ? 'dark-mode' : 'light-mode');
            const newTheme = isDarkMode ? 'light-mode' : 'dark-mode';
            body.classList.add(newTheme);
            
            // Persist theme choice
            localStorage.setItem('theme', newTheme);
        });
    }

    // 4. Close Wallet Modal Listener
    if (modalCloseBtn && walletModal) {
      modalCloseBtn.addEventListener('click', () => walletModal.style.display ="none");
    }
    // Added a check before accessing document.getElementById
    if (document.getElementById("mobile-overlay")) {
        document.getElementById("mobile-overlay").addEventListener('click', () => walletModal.style.display ="none");
    }

    // 5. Close Action Modal Listener
    window.addEventListener('click', e => {
      if (actionModal && e.target === actionModal) {
        actionModal.style.display = 'none';
      }
    });

    // 6. Profile Dropdown Toggle Logic
    if (profileDropdownContainer && profileDropdownMenu) {
        // Toggle the dropdown visibility when the container is clicked
        profileDropdownContainer.addEventListener('click', (e) => {
            // Stop propagation to prevent the window click listener from immediately closing it
            e.stopPropagation(); 
            profileDropdownMenu.classList.toggle('hidden');
        });

        // Close dropdown when clicking anywhere else on the window
        window.addEventListener('click', (e) => {
            // Check if the dropdown is visible AND the click target is outside the container
            if (!profileDropdownMenu.classList.contains('hidden') && !profileDropdownContainer.contains(e.target)) {
                profileDropdownMenu.classList.add('hidden');
            }
        });
    }

}

// -------------------------
// Auth & Admin check
// -------------------------
async function checkAdmin() {
  // If supabase failed to initialize, redirect immediately.
  if (!supabase) {
    window.location.href = "../admin-login.html";
    return false;
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "../admin-login.html";
    return false;
  }

  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  if (adminError || !adminData) {
    await supabase.auth.signOut();
    window.location.href = "../admin-login.html";
    return false;
  }

  return true;
}

// -------------------------
// Fetch All Users (Consolidated Data Source)
// -------------------------
async function fetchAllUsers() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order('created_at', { ascending: true }); 

  if (error) {
    console.error('Error fetching users:', error);
    return showMessage("Failed to load users", "error");
  }

  allUsers = data;

  // Only render if the container elements exist on the current page
  if (overviewUserContainer) renderOverviewUsers(); 
  if (walletUserContainer) renderFilteredWalletUsers(); 
}


// -------------------------
// Render 1: Simple User Overview (for usersContainer - Simple Actions)
// -------------------------
function renderOverviewUsers() {
  if (!overviewUserContainer) return;
  overviewUserContainer.innerHTML = "";

  allUsers.forEach(user => {
    // Note: 'isBanned' and 'isFrozen' fields are used here.
    const card = document.createElement("div");
    card.className = "user-card p-4 mb-2 bg-gray-50 rounded-lg shadow";
    card.innerHTML = `
      <h4 class="font-bold text-lg">${user.username || user.email}</h4>
      <p>Balance: <span class="font-mono text-green-600">$${Number(user.balance || 0).toFixed(2)}</span></p>
      <p>Status: <span class="${user.isBanned ? "text-red-500" : user.isFrozen ? "text-yellow-500" : "text-green-500"}">${user.isBanned ? "BANNED" : user.isFrozen ? "FROZEN" : "Active"}</span></p>
      <div class="card-actions mt-2 flex gap-2 flex-wrap">
        <button class="update-balance-btn bg-blue-500 text-white p-2 rounded text-xs hover:bg-blue-600" data-userid="${user.id}">Update Balance</button>
        <button class="toggle-ban-btn bg-red-500 text-white p-2 rounded text-xs hover:bg-red-600" data-userid="${user.id}">${user.isBanned ? "Unban" : "Ban"}</button>
        <button class="toggle-freeze-btn bg-yellow-500 text-white p-2 rounded text-xs hover:bg-yellow-600" data-userid="${user.id}">${user.isFrozen ? "Unfreeze" : "Freeze"}</button>
        <button class="delete-user-btn bg-gray-500 text-white p-2 rounded text-xs hover:bg-gray-600" data-userid="${user.id}">Delete</button>
      </div>
    `;
    overviewUserContainer.appendChild(card);
  });

  attachUserCardListeners();
}

// -------------------------
// User Actions (Simple)
// -------------------------
function attachUserCardListeners() {
  // Use optional chaining for safety on querySelectorAll results
  document.querySelectorAll(".update-balance-btn")?.forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const newBalance = prompt("Enter new balance for user:");
      if (newBalance === null) return;

      const balanceNum = parseFloat(newBalance);
      if (isNaN(balanceNum) || balanceNum < 0) {
        return showMessage("Invalid balance entered. Must be a positive number.", "error");
      }

      const { error } = await supabase.from("users").update({ balance: balanceNum }).eq("id", userId);
      if (error) return showMessage("Failed to update balance", "error");
      showMessage("Balance updated");
      fetchAllUsers(); 
    });
  });

  document.querySelectorAll(".toggle-ban-btn")?.forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const user = allUsers.find(u => u.id === userId); 
      if (!user) return;
      const { error } = await supabase.from("users").update({ isBanned: !user.isBanned }).eq("id", userId);
      if (error) return showMessage("Failed to toggle ban", "error");
      showMessage(`User ${!user.isBanned ? "banned" : "unbanned"}.`);
      fetchAllUsers();
    });
  });

  document.querySelectorAll(".toggle-freeze-btn")?.forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const user = allUsers.find(u => u.id === userId); 
      if (!user) return;
      const { error } = await supabase.from("users").update({ isFrozen: !user.isFrozen }).eq("id", userId);
      if (error) return showMessage("Failed to toggle freeze", "error");
      showMessage(`User ${!user.isFrozen ? "frozen" : "unfrozen"}.`);
      fetchAllUsers();
    });
  });

  document.querySelectorAll(".delete-user-btn")?.forEach(btn => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      if (!showConfirmation("Are you sure you want to delete this user? This action cannot be undone.")) return;

      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) return showMessage("Failed to delete user", "error");
      showMessage("User deleted");
      fetchAllUsers();
    });
  });
}

// ----------------------------
// Render 2: Filtered Wallet/Status List (for users-cards-container)
// ----------------------------
function renderFilteredWalletUsers() {
  // Only run if the container and necessary filters exist on the page
  if (!walletUserContainer || !searchInput || !accountFilter || !verificationFilter || !statusFilter) return;

  const searchTerms = searchInput.value.toLowerCase();
  const accFilter = accountFilter.value;
  const verFilter = verificationFilter.value;
  const statusFilt = statusFilter.value;

  walletUserContainer.innerHTML = '';

  const filtered = allUsers.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerms) || user.email?.toLowerCase().includes(searchTerms) || user.id?.toLowerCase().includes(searchTerms);
    const matchesAccount = accFilter === "all" || user.account_type === accFilter;
    const matchesVerification = verFilter === "all" || user.verification === verFilter;
    const matchesStatus = statusFilt === 'all' || user.status?.toLowerCase() === statusFilt;
    
    return matchesSearch && matchesAccount && matchesVerification && matchesStatus;
  });

  if (!filtered.length) {
    walletUserContainer.innerHTML = `<p class="text-center text-gray-500 p-8">No users found matching current filters.</p>`;
    return;
  }

  filtered.forEach(user => {
    const card = document.createElement('div');
    card.className = "user-card p-4 mb-2 bg-white rounded-lg shadow-md flex justify-between items-center";
    card.innerHTML = `
        <div class="user-info text-sm space-y-1">
            <span class="block"><strong>Name:</strong> ${user.username || "N/A"}</span>
            <span class="block"><strong>Email:</strong> ${user.email || "N/A"}</span>
            <span class="block"><strong>UID:</strong> ${user.id}</span>
            <span class="block"><strong>Wallet:</strong> ${user.wallet || "N/A"}</span>
            <span class="block"><strong>Verification:</strong> ${user.verification || "unverified"}</span>
        </div>
        <div class="user-actions flex flex-col gap-2">
           <button class="btn-primary bg-indigo-500 text-white p-2 rounded text-xs hover:bg-indigo-600" data-action="edit" data-uid="${user.id}">Edit Wallet/Verif</button>
           <button class="edit-btn bg-teal-500 text-white p-2 rounded text-xs hover:bg-teal-600" data-uid="${user.id}">Edit Balance/Status</button>
        </div>    
    `;
    walletUserContainer.appendChild(card);
  });
}

// Attach filters only if elements exist
if (searchInput) searchInput.addEventListener("input", renderFilteredWalletUsers);
if (accountFilter) accountFilter.addEventListener("change", renderFilteredWalletUsers);
if (verificationFilter) verificationFilter.addEventListener("change", renderFilteredWalletUsers);
if (statusFilter) statusFilter.addEventListener('change', renderFilteredWalletUsers);


// Open wallet modal with user data 
if (walletUserContainer) {
  walletUserContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="edit"]');
    if (!btn || !walletModal) return; // Defensive check for walletModal

    const uid = btn.dataset.uid;
    const user = allUsers.find(u => u.id === uid);
    if (!user) return;

    modalUidInput.value = user.id;
    modalWalletInput.value = user.wallet || '';
    modalAccountSelect.value = user.account_type || "mini";
    modalVerificationSelect.value = user.verification || "unverified";
    modalUserTitle.textContent = `Manage Wallet & Verification: ${user.username || user.email}`;
    walletModal.style.display = "flex";
  });
}


// save wallet changes
if (walletModalForm) {
  walletModalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uid = modalUidInput.value;
    const updatedWallet = modalWalletInput.value.trim();
    const updatedAccount = modalAccountSelect.value;
    const updatedVerification = modalVerificationSelect.value;

    const { error } = await supabase.from("users").update({
      wallet: updatedWallet,
      account_type: updatedAccount,
      verification: updatedVerification
    }).eq("id", uid);

    if (error) {
      showMessage('Wallet update failed: ' + error.message, 'error');
      return;
    }

    // update local array
    const userIndex = allUsers.findIndex(u => u.id === uid);
    if (userIndex > -1) {
      allUsers[userIndex].wallet = updatedWallet;
      allUsers[userIndex].account_type = updatedAccount;
      allUsers[userIndex].verification = updatedVerification;
    }

    renderFilteredWalletUsers(); 
    walletModal.style.display = "none";
    showMessage("Wallet and verification status updated successfully.");
  });
}


// ===============================
// Modal Open / Close (Balance/Status Modal)
// ===============================
if (walletUserContainer) {
  walletUserContainer.addEventListener('click', e => {
    const editBtn = e.target.closest('.edit-btn');
    if (!editBtn || !actionModal) return; // Defensive check for actionModal

    const userId = editBtn.dataset.uid;
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    actionModalUserId.value = user.id;
    newBalanceInput.value = user.balance || 0;
    accountStatusSelect.value = user.status || 'normal'; 
    balanceActionSelect.value = 'set';

    actionModal.style.display = 'flex';
  });
}


// ===============================
// Update User (Balance & Status) via Modal
// ===============================
if (balanceActionForm) {
  balanceActionForm.addEventListener('submit', async e => {
    e.preventDefault();

    const uid = actionModalUserId.value;
    let balance = parseFloat(newBalanceInput.value);
    const action = balanceActionSelect.value;
    const status = accountStatusSelect.value;

    const user = allUsers.find(u => u.id === uid);
    if (!user) return;
    if (isNaN(balance)) return showMessage("Invalid balance amount entered.", "error");

    if (action === 'add') balance = (user.balance || 0) + balance;
    else if (action === 'subtract') balance = (user.balance || 0) - balance;

    const { error } = await supabase
      .from('users')
      .update({ balance, status })
      .eq('id', uid);

    if (error) {
      console.error('Update failed:', error);
      showMessage('Failed to update user balance/status.', 'error');
      return;
    }

    // Update local state
    const index = allUsers.findIndex(u => u.id === uid);
    allUsers[index] = { ...allUsers[index], balance, status };
    renderFilteredWalletUsers();
    renderOverviewUsers(); 
    actionModal.style.display = 'none';
    showMessage("Balance and status updated successfully.");
  });
}


// ===============================
// Freeze & Ban Buttons
// ===============================
if (walletUserContainer) {
  walletUserContainer.addEventListener('click', async e => {
    const freezeBtn = e.target.closest('.freeze-btn');
    const banBtn = e.target.closest('.ban-btn');

    if (!freezeBtn && !banBtn) return;

    const uid = (freezeBtn || banBtn).dataset.uid;
    const newStatus = freezeBtn ? 'frozen' : 'banned';

    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', uid);

    if (error) {
      console.error(`Failed to set status ${newStatus}:`, error);
      showMessage('Failed to update status.', 'error');
      return;
    }

    // Update local state
    const index = allUsers.findIndex(u => u.id === uid);
    allUsers[index].status = newStatus;
    renderFilteredWalletUsers();
    renderOverviewUsers(); 
    showMessage(`User status set to ${newStatus}.`);
  });
}


// -------------------------
// Fetch & Render Transactions
// -------------------------
async function fetchTransactions() {
  if (!supabase || !txContainer) return;

  const { data, error } = await supabase.from("transactions").select("*").eq("status", "pending");
  if (error) return showMessage("Failed to load transactions", "error");

  transactions = data;
  renderTransactions();
}

function renderTransactions() {
  if (!txContainer) return;
  txContainer.innerHTML = "";

  transactions.forEach(tx => {
    const user = allUsers.find(u => u.id === tx.userId);
    const card = document.createElement("div");
    card.className = "tx-card p-4 mb-2 bg-yellow-50 rounded-lg shadow";
    card.innerHTML = `
      <h4 class="font-bold">${user ? user.username || user.email : "Unknown"}</h4>
      <p>Type: <span class="uppercase">${tx.type}</span></p>
      <p>Amount: <span class="font-mono text-xl text-indigo-700">$${Number(tx.amount).toFixed(2)}</span></p>
      <div class="card-actions mt-2 flex gap-2">
        <button class="approve-tx-btn bg-green-500 text-white p-2 rounded text-xs hover:bg-green-600" data-txid="${tx.id}">Approve</button>
        <button class="reject-tx-btn bg-red-500 text-white p-2 rounded text-xs hover:bg-red-600" data-txid="${tx.id}">Reject</button>
      </div>
    `;
    txContainer.appendChild(card);
  });

  attachTransactionListeners();
}

function attachTransactionListeners() {
  // Use optional chaining for safety on querySelectorAll results
  document.querySelectorAll(".approve-tx-btn")?.forEach(btn => {
    btn.addEventListener("click", async () => {
      const txId = btn.dataset.txid;
      const tx = transactions.find(t => t.id === txId);
      if (!tx) return;

      const user = allUsers.find(u => u.id === tx.userId);
      if (!user) return showMessage("User not found for transaction", "error");

      let newBalance = Number(user.balance);
      if (tx.type === "deposit") newBalance += Number(tx.amount);
      else if (tx.type === "withdrawal") {
        if (Number(tx.amount) > newBalance) return showMessage("Insufficient balance for withdrawal", "error");
        newBalance -= Number(tx.amount);
      }

      await supabase.from("users").update({ balance: newBalance }).eq("id", user.id);
      await supabase.from("transactions").update({ status: "approved" }).eq("id", txId);
      showMessage("Transaction approved. Balance updated.");
      fetchAllUsers(); 
      fetchTransactions();
    });
  });

  document.querySelectorAll(".reject-tx-btn")?.forEach(btn => {
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
    // Assuming redirection to a login page
    window.location.href = "../admin-login.html"; 
  });
}

// -------------------------
// Initialize Dashboard
// -------------------------
async function init() {
  // Setup all non-data UI controls first (sidebar, theme, modals, dropdowns)
  setupUILogic(); 

  const isAdmin = await checkAdmin();
  if (!isAdmin) return;

  // Fetch data only if admin check passes
  await fetchAllUsers(); 
  await fetchTransactions();
}

init();
