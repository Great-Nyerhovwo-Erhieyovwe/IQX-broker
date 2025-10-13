// assets/js/admin-dashboard.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ===========================
// CONFIG & INITIALIZATION
// ===========================
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI';


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGIN_PAGE = './admin-login.html';

// ===========================
// DOM REFS
// ===========================
let usersContainer = null;
let transactionsContainer = null;

let modalUserInfo = null;
let messageText = null;
let billingAmount = null;
let sendMessageBtn = null;
let closeModalBtn = null;
let modalStatus = null;
let messageModal = null;

let selectedUserId = null;

// ===========================
// UTILS
// ===========================
function domReady() {
  if (document.readyState !== 'loading') return Promise.resolve();
  return new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
}

function showMessage(text, type = 'success') {
  let container = document.getElementById('message-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'message-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const div = document.createElement('div');
  div.textContent = text;
  div.style.background = type === 'success' ? '#0f9d58' : '#e74c3c';
  div.style.color = '#fff';
  div.style.padding = '10px 14px';
  div.style.marginTop = '8px';
  div.style.borderRadius = '6px';
  div.style.fontWeight = '600';
  div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
  container.prepend(div);

  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 400);
  }, 3500);
}

function injectMessageModal() {
  if (!document.getElementById('messageModal')) {
    const html = `
      <div id="messageModal" style="display:none;position:fixed;z-index:10001;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.6);align-items:center;justify-content:center;">
        <div style="background:#fff;border-radius:8px;padding:18px;max-width:640px;width:92%;box-shadow:0 6px 18px rgba(0,0,0,0.2);">
          <h3 style="margin:0 0 10px 0">Send Message / Bill User</h3>
          <p id="modalUserInfo" style="font-weight:600;margin:6px 0 12px 0"></p>
          <label style="display:block;margin-bottom:6px">Message</label>
          <textarea id="messageText" rows="4" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;margin-bottom:12px"></textarea>
          <label style="display:block;margin-bottom:6px">Billing Amount (optional)</label>
          <input id="billingAmount" type="number" min="0" step="0.01" placeholder="e.g. 50.00" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;margin-bottom:12px" />
          <div id="modalStatus" style="min-height:20px;margin-bottom:12px;font-weight:600"></div>
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button id="closeModalBtn" style="padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#f1f1f1;cursor:pointer">Cancel</button>
            <button id="sendMessageBtn" style="padding:8px 12px;border-radius:6px;border:none;background:#007bff;color:#fff;cursor:pointer">Send Action</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }
}

// ===========================
// FETCH & RENDER USERS
// ===========================
async function fetchUsers() {
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) return showMessage(`Error fetching users: ${error.message}`, 'error');
  renderUsers(users);
}

function renderUsers(users) {
  if (!usersContainer) return;
  usersContainer.innerHTML = '';
  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '8px';
    card.style.padding = '16px';
    card.style.marginBottom = '12px';
    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';

    card.innerHTML = `
      <strong>${user.username || user.email}</strong>
      <span>Email: ${user.email}</span>
      <span>Account Type: ${user.account_type || 'Standard'}</span>
      <span>Balance: $<input type="number" min="0" step="0.01" value="${Number(user.balance||0).toFixed(2)}" style="width:100px" id="balance-${user.id}" /> <button class="update-balance" data-id="${user.id}">Update</button></span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="action-btn" data-id="${user.id}" data-action="ban">${user.is_banned ? 'Unban' : 'Ban'}</button>
        <button class="action-btn" data-id="${user.id}" data-action="freeze">${user.is_frozen ? 'Unfreeze' : 'Freeze'}</button>
        <button class="action-btn" data-id="${user.id}" data-action="delete" style="background:#dc3545;color:#fff;">Delete</button>
        <button class="send-message-btn" data-id="${user.id}" data-username="${user.username || user.email}">Message/Bill</button>
        <select class="account-upgrade" data-id="${user.id}">
          <option value="mini" ${user.account_type === 'mini' ? 'selected' : ''}>Mini</option>
          <option value="premium" ${user.account_type === 'premium' ? 'selected' : ''}>Premium</option>
          <option value="platinum" ${user.account_type === 'platinum' ? 'selected' : ''}>Platinum</option>
          <option value="co-investment" ${user.account_type === 'co-investment' ? 'selected' : ''}>Co Investment</option>
        </select>
      </div>
    `;

    usersContainer.appendChild(card);
  });
}

// ===========================
// FETCH & RENDER TRANSACTIONS
// ===========================
async function fetchTransactions() {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'pending');

  if (error) return showMessage(`Error fetching transactions: ${error.message}`, 'error');
  renderTransactions(transactions);
}

function renderTransactions(transactions) {
  if (!transactionsContainer) return;
  transactionsContainer.innerHTML = '';

  transactions.forEach(tx => {
    const txCard = document.createElement('div');
    txCard.className = 'transaction-card';
    txCard.style.border = '1px solid #ddd';
    txCard.style.borderRadius = '8px';
    txCard.style.padding = '12px';
    txCard.style.marginBottom = '12px';
    txCard.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';

    txCard.innerHTML = `
      <span>TX ID: ${tx.id.substring(0,8)}...</span>
      <span>User: ${tx.username || tx.user_id}</span>
      <span>Type: ${tx.type}</span>
      <span>Amount: $${Number(tx.amount||0).toFixed(2)}</span>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="approve-btn" data-id="${tx.id}">Approve</button>
        <button class="reject-btn" data-id="${tx.id}">Reject</button>
      </div>
    `;

    transactionsContainer.appendChild(txCard);
  });
}

// ===========================
// EVENT HANDLERS
// ===========================
function attachUserEvents() {
  usersContainer.addEventListener('click', async e => {
    const updateBtn = e.target.closest('.update-balance');
    const actionBtn = e.target.closest('.action-btn');
    const msgBtn = e.target.closest('.send-message-btn');
    const upgradeSelect = e.target.closest('.account-upgrade');

    if (updateBtn) {
      const userId = updateBtn.dataset.id;
      const input = document.getElementById(`balance-${userId}`);
      const newBalance = parseFloat(input.value);
      if (isNaN(newBalance) || newBalance < 0) return showMessage('Invalid balance', 'error');
      await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
      showMessage('Balance updated');
      fetchUsers();
    }

    if (actionBtn) {
      const userId = actionBtn.dataset.id;
      const action = actionBtn.dataset.action;
      const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

      if (!user) return showMessage('User not found', 'error');

      if (action === 'ban') {
        await supabase.from('users').update({ is_banned: !user.is_banned }).eq('id', userId);
      } else if (action === 'freeze') {
        await supabase.from('users').update({ is_frozen: !user.is_frozen }).eq('id', userId);
      } else if (action === 'delete') {
        if (!confirm(`Delete user ${user.username || user.email}? This is permanent.`)) return;
        await supabase.from('users').delete().eq('id', userId);
      }

      showMessage(`${action} action completed`);
      fetchUsers();
    }

    if (msgBtn) {
      selectedUserId = msgBtn.dataset.id;
      modalUserInfo.textContent = `To: ${msgBtn.dataset.username} (ID: ${selectedUserId.substring(0,8)}...)`;
      messageText.value = '';
      billingAmount.value = '';
      modalStatus.textContent = '';
      messageModal.style.display = 'flex';
    }

    if (upgradeSelect) {
      const userId = upgradeSelect.dataset.id;
      const newType = upgradeSelect.value;
      await supabase.from('users').update({ account_type: newType }).eq('id', userId);
      showMessage('Account upgraded');
      fetchUsers();
    }
  });

  transactionsContainer.addEventListener('click', async e => {
    const approveBtn = e.target.closest('.approve-btn');
    const rejectBtn = e.target.closest('.reject-btn');

    if (approveBtn) {
      const txId = approveBtn.dataset.id;
      const { data: tx } = await supabase.from('transactions').select('*').eq('id', txId).single();
      if (!tx) return showMessage('Transaction not found', 'error');

      const { data: user } = await supabase.from('users').select('*').eq('id', tx.user_id).single();
      if (!user) return showMessage('User not found', 'error');

      let newBalance = Number(user.balance || 0);
      if (tx.type === 'deposit') newBalance += Number(tx.amount || 0);
      else if (tx.type === 'withdrawal') {
        if (Number(tx.amount || 0) > newBalance) return showMessage('Insufficient balance', 'error');
        newBalance -= Number(tx.amount || 0);
      }

      await supabase.from('users').update({ balance: newBalance }).eq('id', user.id);
      await supabase.from('transactions').update({ status: 'approved' }).eq('id', tx.id);
      showMessage('Transaction approved');
      fetchUsers();
      fetchTransactions();
    }

    if (rejectBtn) {
      const txId = rejectBtn.dataset.id;
      await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txId);
      showMessage('Transaction rejected');
      fetchTransactions();
    }
  });
}

// ===========================
// MESSAGE MODAL EVENTS
// ===========================
function attachModalEvents() {
  closeModalBtn.addEventListener('click', () => { messageModal.style.display = 'none'; });
  sendMessageBtn.addEventListener('click', async () => {
    if (!selectedUserId) return showMessage('No user selected', 'error');

    const msg = messageText.value.trim();
    const billing = parseFloat(billingAmount.value) || 0;

    if (!msg && billing <= 0) return modalStatus.textContent = 'Enter message or positive billing amount';

    modalStatus.textContent = 'Processing...';
    try {
      if (billing > 0) {
        const { data: user } = await supabase.from('users').select('*').eq('id', selectedUserId).single();
        if (!user) throw new Error('User not found');
        const newBalance = (Number(user.balance)