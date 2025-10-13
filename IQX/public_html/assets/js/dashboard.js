// dashboard-supabase.js — Full Supabase migration (copy/paste)
// Replace with your Supabase values OR create client globally and remove the createClient call.
const SUPABASE_URL = 'https://aqotnpbcrqaiqonpfshj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxb3RucGJjcnFhaXFvbnBmc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDUwNDMsImV4cCI6MjA3NTQ4MTA0M30.rqwwCxMp2PBydSE99QJOL-nt1UjxkI7-ea0Q8Wk5SVI';

document.addEventListener('DOMContentLoaded', async () => {
  // --- Ensure Supabase client available ---
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase JS not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return;
  }
  // Create a client (safe to create each page). If you already create one globally, you can reuse it.
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- App state & channels ---
  const CHANNELS = { user: null, tx: null, config: null };
  let authSubscription = null;
  let currentUser = null;
  let userProfile = {};
  let notifiedTxIds = new Set();
  let WALLET_CONFIG = {};
  let tradingViewLoaded = false;

  // --- DOM references (queried once) ---
  const DOM = {
    profileName: document.getElementById('profileName'),
    balanceAmount: document.getElementById('balanceAmount'),
    roi: document.getElementById('roi'),
    initialInvestment: document.getElementById('initialInvestment'),
    activeDeposit: document.getElementById('activeDeposit'),
    transactionList: document.getElementById('transactionList'),

    addModal: document.getElementById('addModal'),
    withdrawModal: document.getElementById('withdrawModal'),
    openAddBtn: document.getElementById('openAddFunds'),
    openWithdrawBtn: document.getElementById('openWithdrawFunds'),
    closeButtons: document.querySelectorAll('.close-btn'),
    confirmAdd: document.getElementById('confirmAdd'),
    confirmWithdraw: document.getElementById('confirmWithdraw'),
    addAmount: document.getElementById('addAmount'),
    withdrawAmount: document.getElementById('withdrawAmount'),
    statusAdd: document.getElementById('statusAdd'),
    statusWithdraw: document.getElementById('statusWithdraw'),

    coinType: document.getElementById('coinType'),
    networkType: document.getElementById('networkType'),
    walletAddressDisplay: document.getElementById('walletAddressDisplay'),
    qrCodeImage: document.getElementById('qrCodeImage'),

    sidebar: document.getElementById("sidebar"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
    hamburgerIcon: document.querySelector("#sidebar-toggle i"),
    mainContent: document.getElementById("main-content"),
    mobileOverlay: document.getElementById("mobile-overlay"),
    themeToggle: document.getElementById("theme-toggle"),
    themeIcon: document.querySelector("#theme-toggle i"),
    profileDropdown: document.getElementById("profile-dropdown"),
    dashboardContainer: document.getElementById("dashboard-container")
  };
  DOM.dropdownMenu = DOM.profileDropdown ? DOM.profileDropdown.querySelector(".dropdown-menu") : null;

  // ---------- Small utilities ----------
  function safeText(el, txt) { if (el) el.textContent = txt ?? ''; }
  function showPopup(message, isSuccess = true) {
    if (!document.body) return;
    let popupContainer = document.getElementById('popupContainer');
    if (!popupContainer) {
      popupContainer = document.createElement('div');
      popupContainer.id = 'popupContainer';
      popupContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index:10000; max-width: 360px;';
      document.body.appendChild(popupContainer);
    }
    const popup = document.createElement('div');
    popup.textContent = message;
    popup.style.cssText = `
      background-color: ${isSuccess ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 10px 14px;
      margin-top: 10px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      opacity: 1;
      transition: opacity 0.5s ease-out;
    `;
    popupContainer.prepend(popup);
    setTimeout(() => { popup.style.opacity = '0'; setTimeout(() => popup.remove(), 500); }, 3600);
  }
  function formatUSD(amount) { return `$${Number(amount || 0).toFixed(2)}`; }
  function normalizeKey(k) { if (!k && k !== '') return ''; return String(k).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function findCoinKey(walletConfig, coinRequested) {
    if (!walletConfig || typeof walletConfig !== 'object') return null;
    if (coinRequested && walletConfig[coinRequested]) return coinRequested;
    const normReq = normalizeKey(coinRequested);
    for (const key of Object.keys(walletConfig)) {
      if (normalizeKey(key) === normReq) return key;
    }
    return Object.keys(walletConfig)[0] || null;
  }
  function findNetworkKey(networksObj, networkRequested) {
    if (!networksObj || typeof networksObj !== 'object') return null;
    if (networkRequested && networksObj[networkRequested]) return networkRequested;
    const normReq = normalizeKey(networkRequested);
    for (const key of Object.keys(networksObj)) {
      if (normalizeKey(key) === normReq) return key;
    }
    return Object.keys(networksObj)[0] || null;
  }

  // ---------- Wallet config (fetch + realtime) ----------
  async function fetchWalletConfigOnce() {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('wallet')
        .eq('id', 'wallet')
        .single();
      if (error && error.code !== 'PGRST116') { // some errors may be due to no row
        console.warn('wallet config fetch error', error);
        WALLET_CONFIG = {};
      } else {
        WALLET_CONFIG = data?.wallet ?? {};
      }
    } catch (err) {
      console.error('fetchWalletConfigOnce exception', err);
      WALLET_CONFIG = {};
    }
    updateNetworkOptions();
  }

  function subscribeWalletConfig() {
    // Unsubscribe existing
    if (CHANNELS.config) {
      CHANNELS.config.unsubscribe?.().catch(()=>{});
      CHANNELS.config = null;
    }
    try {
      CHANNELS.config = supabase
        .channel(`config-wallet`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: `id=eq.wallet` }, (payload) => {
          // payload.new is the updated row
          if (payload?.new?.wallet) {
            WALLET_CONFIG = payload.new.wallet;
          } else {
            WALLET_CONFIG = {};
          }
          updateNetworkOptions();
        }).subscribe();
    } catch (err) {
      console.warn('subscribeWalletConfig failed', err);
    }
  }

  function updateNetworkOptions() {
    const coinTypeSelect = DOM.coinType;
    const networkTypeSelect = DOM.networkType;
    const walletAddressDisplay = DOM.walletAddressDisplay;
    const qrCodeImage = DOM.qrCodeImage;
    if (!coinTypeSelect || !networkTypeSelect) return;

    networkTypeSelect.innerHTML = '';
    const coinKeys = Object.keys(WALLET_CONFIG || {});
    if (coinKeys.length === 0) {
      coinTypeSelect.innerHTML = '<option value="">-- No coins configured --</option>';
      if (walletAddressDisplay) walletAddressDisplay.textContent = 'No configuration';
      if (qrCodeImage?.parentElement) qrCodeImage.parentElement.style.display = 'none';
      return;
    }

    const prevCoin = coinTypeSelect.value;
    const matchedCoinKey = findCoinKey(WALLET_CONFIG, prevCoin) || coinKeys[0];

    coinTypeSelect.innerHTML = '';
    coinKeys.forEach(ck => {
      const opt = document.createElement('option');
      opt.value = ck;
      opt.textContent = ck;
      coinTypeSelect.appendChild(opt);
    });
    coinTypeSelect.value = matchedCoinKey;

    const networksObj = WALLET_CONFIG[matchedCoinKey] || {};
    const networkKeys = Object.keys(networksObj);
    if (networkKeys.length === 0) {
      networkTypeSelect.innerHTML = '<option value="">-- No networks --</option>';
      if (walletAddressDisplay) walletAddressDisplay.textContent = 'Configuration not available.';
      if (qrCodeImage?.parentElement) qrCodeImage.parentElement.style.display = 'none';
      return;
    }

    const prevNetwork = networkTypeSelect.value;
    const matchedNetworkKey = findNetworkKey(networksObj, prevNetwork) || networkKeys[0];
    networkTypeSelect.innerHTML = '';
    networkKeys.forEach(nk => {
      const opt = document.createElement('option');
      opt.value = nk;
      opt.textContent = nk;
      networkTypeSelect.appendChild(opt);
    });
    networkTypeSelect.value = matchedNetworkKey;

    updateDepositDisplay();
  }

  function updateDepositDisplay() {
    const walletAddressDisplay = DOM.walletAddressDisplay;
    const qrCodeImage = DOM.qrCodeImage;
    const coinTypeSelect = DOM.coinType;
    const networkTypeSelect = DOM.networkType;
    if (!walletAddressDisplay || !qrCodeImage || !coinTypeSelect || !networkTypeSelect) return;

    const selectedCoin = coinTypeSelect.value || '';
    const selectedNetwork = networkTypeSelect.value || '';
    const coinKey = findCoinKey(WALLET_CONFIG, selectedCoin);
    const networkKey = coinKey ? findNetworkKey(WALLET_CONFIG[coinKey], selectedNetwork) : null;
    const data = (coinKey && networkKey) ? (WALLET_CONFIG[coinKey]?.[networkKey]) : null;

    if (data && data.address) {
      walletAddressDisplay.textContent = data.address;
      if (data.qr_path) {
        qrCodeImage.src = data.qr_path;
        if (qrCodeImage.parentElement) qrCodeImage.parentElement.style.display = '';
      } else if (qrCodeImage.parentElement) {
        qrCodeImage.parentElement.style.display = 'none';
      }
    } else {
      walletAddressDisplay.textContent = 'Configuration not available.';
      if (qrCodeImage.parentElement) qrCodeImage.parentElement.style.display = 'none';
    }
  }

  // ---------- User profile & realtime ----------
  async function fetchUserProfileOnce(uid) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
      if (error) throw error;
      userProfile = data || {};
      renderProfile();
      // Ban check
      if (userProfile.is_banned) {
        await handleForcedLogout('Your account has been banned. Contact support.');
      }
    } catch (err) {
      console.error('fetchUserProfileOnce error', err);
    }
  }

  function renderProfile() {
    safeText(DOM.profileName, `Welcome, ${userProfile?.username || 'User'}`);
    safeText(DOM.balanceAmount, formatUSD(userProfile?.balance));
    safeText(DOM.roi, formatUSD(userProfile?.roi));
    safeText(DOM.initialInvestment, formatUSD(userProfile?.active_trades));
    safeText(DOM.activeDeposit, `${userProfile?.deposits ?? 0} active deposits`);
  }

  function subscribeUserProfile(uid) {
    if (!uid) return;
    if (CHANNELS.user) {
      CHANNELS.user.unsubscribe?.().catch(()=>{});
      CHANNELS.user = null;
    }
    try {
      CHANNELS.user = supabase
        .channel(`user-${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, (payload) => {
          // payload.eventType: INSERT / UPDATE / DELETE
          if (payload?.new) {
            userProfile = payload.new;
            renderProfile();
            if (userProfile.is_banned) {
              handleForcedLogout('Your account has been banned. Contact support.');
            }
          } else if (payload?.old && !payload?.new) {
            // user deleted?
            handleForcedLogout('Your account was removed. Please contact support.');
          }
        }).subscribe();
    } catch (err) {
      console.error('subscribeUserProfile error', err);
    }
  }

  // ---------- Transactions: fetch & realtime ----------
  async function fetchTransactionsOnce(uid) {
    if (!uid) return;
    try {
      // restore notified ids
      try {
        const stored = localStorage.getItem(`notifiedTransactions_${uid}`);
        if (stored) notifiedTxIds = new Set(JSON.parse(stored));
      } catch (e) { console.warn('notified parse', e); }

      const { data: txs = [], error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      // render latest 5
      DOM.transactionList && (DOM.transactionList.innerHTML = '');
      txs.slice(0, 5).forEach(tx => {
        const li = document.createElement('li');
        const date = tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A';
        li.textContent = `${date}: ${tx.type} of ${formatUSD(tx.amount)} — Status: ${tx.status || 'N/A'}`;
        DOM.transactionList && DOM.transactionList.appendChild(li);

        // notify status changes: approved/declined
        if ((tx.status === 'approved' || tx.status === 'declined') && !notifiedTxIds.has(tx.id)) {
          const action = (tx.type || '').charAt(0).toUpperCase() + (tx.type || '').slice(1);
          const isSuccess = tx.status === 'approved';
          showPopup(`${action} of ${formatUSD(tx.amount)} was ${isSuccess ? 'approved ✅' : 'declined ❌'}`, isSuccess);
          notifiedTxIds.add(tx.id);
          try { localStorage.setItem(`notifiedTransactions_${uid}`, JSON.stringify([...notifiedTxIds])); } catch (e) {}
        }
      });
    } catch (err) {
      console.error('fetchTransactionsOnce error', err);
    }
  }

  function subscribeTransactions(uid) {
    if (!uid) return;
    if (CHANNELS.tx) {
      CHANNELS.tx.unsubscribe?.().catch(()=>{});
      CHANNELS.tx = null;
    }
    try {
      CHANNELS.tx = supabase
        .channel(`transactions-${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${uid}` }, (payload) => {
          // For efficiency, handle payload directly when possible
          const newRow = payload?.new;
          const oldRow = payload?.old;
          // If it's insert or update, refresh the small transaction list and notify if status changed to approved/declined
          fetchTransactionsOnce(uid);

          if (newRow && (newRow.status === 'approved' || newRow.status === 'declined')) {
            if (!notifiedTxIds.has(newRow.id)) {
              const isSuccess = newRow.status === 'approved';
              const action = (newRow.type || '').charAt(0).toUpperCase() + (newRow.type || '').slice(1);
              showPopup(`${action} of ${formatUSD(newRow.amount)} was ${isSuccess ? 'approved ✅' : 'declined ❌'}`, isSuccess);
              notifiedTxIds.add(newRow.id);
              try { localStorage.setItem(`notifiedTransactions_${uid}`, JSON.stringify([...notifiedTxIds])); } catch (e) {}
            }
          }
        }).subscribe();
    } catch (err) {
      console.error('subscribeTransactions error', err);
    }
  }

  // ---------- Deposit / Withdraw handlers ----------
  async function handleDepositSubmit(e) {
    e?.preventDefault?.();
    if (!currentUser) { alert('Session expired. Please log in again.'); return; }
    if (userProfile?.is_frozen) {
      if (DOM.statusAdd) { DOM.statusAdd.textContent = '❌ Transactions are frozen by admin.'; DOM.statusAdd.style.color = 'red'; }
      return;
    }

    const amount = parseFloat(DOM.addAmount?.value);
    if (!amount || isNaN(amount) || amount <= 0) {
      if (DOM.statusAdd) { DOM.statusAdd.textContent = ' ! Enter valid amount.'; DOM.statusAdd.style.color = 'red'; }
      return;
    }

    DOM.statusAdd && (DOM.statusAdd.textContent = ' ⏳ Submitting...');
    try {
      const { error } = await supabase.from('transactions').insert([{
        user_id: currentUser.id,
        type: 'deposit',
        amount,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      DOM.statusAdd && (DOM.statusAdd.textContent = ' ✅ Request submitted!');
      showPopup(`Deposit of ${formatUSD(amount)} submitted.`, true);
      if (DOM.addAmount) DOM.addAmount.value = '';
      closeModal(DOM.addModal);
    } catch (err) {
      console.error('handleDepositSubmit error', err);
      DOM.statusAdd && (DOM.statusAdd.textContent = '❌ ' + (err.message || 'Submission failed'));
    }
  }

  async function handleWithdrawSubmit(e) {
    e?.preventDefault?.();
    if (!currentUser) { alert('Session expired. Please log in again.'); return; }
    if (userProfile?.is_frozen) {
      if (DOM.statusWithdraw) { DOM.statusWithdraw.textContent = '❌ Transactions are frozen by admin.'; DOM.statusWithdraw.style.color = 'red'; }
      return;
    }

    const amount = parseFloat(DOM.withdrawAmount?.value);
    // prefer an explicit walletAddress input with name attribute if available
    let walletInput = null;
    if (DOM.withdrawModal) {
      walletInput = DOM.withdrawModal.querySelector('input[name="walletAddress"]') || DOM.withdrawModal.querySelector('input[type="text"]');
    }
    const walletAddress = walletInput?.value?.trim?.() || '';

    if (!walletAddress) {
      if (DOM.statusWithdraw) { DOM.statusWithdraw.textContent = ' ! Enter wallet address'; DOM.statusWithdraw.style.color = 'red'; }
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      if (DOM.statusWithdraw) { DOM.statusWithdraw.textContent = ' ! Enter valid amount.'; DOM.statusWithdraw.style.color = 'red'; }
      return;
    }
    if (amount > (userProfile?.balance || 0)) {
      if (DOM.statusWithdraw) { DOM.statusWithdraw.textContent = ' ! Insufficient balance.'; DOM.statusWithdraw.style.color = 'red'; }
      return;
    }

    DOM.statusWithdraw && (DOM.statusWithdraw.textContent = ' ⏳ Submitting...');
    try {
      const { error } = await supabase.from('transactions').insert([{
        user_id: currentUser.id,
        type: 'withdrawal',
        amount,
        wallet_address: walletAddress,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
      if (error) throw error;
      DOM.statusWithdraw && (DOM.statusWithdraw.textContent = ' ✅ Request submitted!');
      showPopup(`Withdrawal of ${formatUSD(amount)} submitted.`, true);
      if (DOM.withdrawAmount) DOM.withdrawAmount.value = '';
      if (walletInput) walletInput.value = '';
      closeModal(DOM.withdrawModal);
    } catch (err) {
      console.error('handleWithdrawSubmit error', err);
      DOM.statusWithdraw && (DOM.statusWithdraw.textContent = '❌ ' + (err.message || 'Submission failed'));
    }
  }

  // ---------- Modal utilities ----------
  function openModal(modal) { if (modal) modal.style.display = 'flex'; }
  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    // clear status/inputs for modals
    if (modal === DOM.addModal) {
      if (DOM.addAmount) DOM.addAmount.value = '';
      if (DOM.statusAdd) DOM.statusAdd.textContent = '';
    }
    if (modal === DOM.withdrawModal) {
      if (DOM.withdrawAmount) DOM.withdrawAmount.value = '';
      if (DOM.statusWithdraw) DOM.statusWithdraw.textContent = '';
      const w = DOM.withdrawModal.querySelector('input[type="text"]');
      if (w) w.value = '';
    }
  }

  // ---------- TradingView ----------
  function initTradingView() {
    const container = document.getElementById("tradingview_eurusd");
    if (!container) return;
    const isDarkMode = document.body.classList.contains("dark-mode");
    const theme = isDarkMode ? "dark" : "light";
    container.innerHTML = '';

    // avoid injecting script multiple times
    const hasScript = Array.from(document.querySelectorAll('script[src]')).some(s => s.src && s.src.includes('s3.tradingview.com/tv.js'));
    if (!hasScript) {
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/tv.js';
      s.onload = () => {
        try {
          if (window.TradingView) {
            new window.TradingView.widget({
              container_id: "tradingview_eurusd",
              autosize: true,
              symbol: "FX:EURUSD",
              interval: "D",
              theme,
              style: "1",
              locale: "en",
              width: "100%",
              height: 400
            });
          }
        } catch (e) { console.warn('TradingView init failed', e); }
      };
      document.head.appendChild(s);
    } else {
      if (window.TradingView) {
        try {
          new window.TradingView.widget({
            container_id: "tradingview_eurusd",
            autosize: true,
            symbol: "FX:EURUSD",
            interval: "D",
            theme,
            style: "1",
            locale: "en",
            width: "100%",
            height: 400
          });
        } catch (e) { console.warn('TradingView re-init failed', e); }
      }
    }
  }

  // ---------- Chart.js (analyticsChart) ----------
  function initChart() {
    const canvas = document.getElementById('analyticsChart');
    if (!canvas || !window.Chart) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      if (window.dashboardChart) {
        try { window.dashboardChart.destroy(); } catch (e) { /* ignore */ }
      }

      const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const dataPoints = [3000,2200,2700,1800,1900,2500,4000,3200,1600,3722,2900,3500];

      window.dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Portfolio Value',
            data: dataPoints,
            borderColor: '#dc691e',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              ticks: { callback: value => `$${value/1000}K`, color: '#999' },
              grid: { color: '#eee' }
            },
            x: {
              ticks: { color: '#888' },
              grid: { display: false }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label(ctx) { const val = ctx.raw; return `Value: $${val.toLocaleString()}`; }
              }
            },
            legend: { labels: { color: '#555' } }
          }
        }
      });
    } catch (err) {
      console.warn('initChart error', err);
    }
  }

  // ---------- UI initialization (theme/sidebar/profile dropdown) ----------
  function initUI() {
    // theme
    if (DOM.themeToggle && DOM.themeIcon) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark-mode') {
        document.body.classList.add('dark-mode');
        DOM.themeIcon.classList.replace('fa-moon', 'fa-sun');
      }
      DOM.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
          DOM.themeIcon.classList.replace('fa-moon', 'fa-sun');
          localStorage.setItem('theme', 'dark-mode');
        } else {
          DOM.themeIcon.classList.replace('fa-sun', 'fa-moon');
          localStorage.setItem('theme', 'light-mode');
        }
        setTimeout(initTradingView, 300); // reinit TradingView after theme change
      });
    }

    // sidebar toggle
    if (DOM.sidebar && DOM.sidebarToggle && DOM.mainContent && DOM.mobileOverlay && DOM.hamburgerIcon) {
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      const toggleSidebar = () => {
        if (mediaQuery.matches) {
          DOM.sidebar.classList.toggle("open");
          DOM.mainContent.classList.toggle("pushed-mobile");
          if (DOM.mobileOverlay) DOM.mobileOverlay.classList.toggle("visible");
          DOM.sidebarToggle.classList.toggle("is-active");
        } else if (DOM.dashboardContainer) {
          DOM.dashboardContainer.classList.toggle("sidebar-collapsed");
          DOM.sidebarToggle.classList.toggle("is-active");
        }
        if (DOM.hamburgerIcon.classList.contains("fa-bars")) {
          DOM.hamburgerIcon.classList.replace("fa-bars", "fa-times");
        } else {
          DOM.hamburgerIcon.classList.replace("fa-times", "fa-bars");
        }
      };

      DOM.sidebarToggle.addEventListener("click", toggleSidebar);
      if (DOM.mobileOverlay) DOM.mobileOverlay.addEventListener("click", toggleSidebar);

      const setInitialSidebarState = () => {
        if (mediaQuery.matches) {
          DOM.sidebar.classList.remove("open");
          DOM.mainContent.classList.remove("pushed-mobile");
          if (DOM.mobileOverlay) DOM.mobileOverlay.classList.remove("visible");
        }
        if (DOM.dashboardContainer) DOM.dashboardContainer.classList.remove("sidebar-collapsed");
        if (DOM.hamburgerIcon) { DOM.hamburgerIcon.classList.remove("fa-times"); DOM.hamburgerIcon.classList.add("fa-bars"); }
        if (DOM.sidebarToggle) DOM.sidebarToggle.classList.remove("is-active");
      };
      setInitialSidebarState();
      mediaQuery.addEventListener('change', setInitialSidebarState);
    }

    // profile dropdown
    if (DOM.profileDropdown && DOM.dropdownMenu) {
      DOM.profileDropdown.addEventListener('click', (e) => {
        DOM.dropdownMenu.classList.toggle('hidden');
        e.stopPropagation();
      });
      document.addEventListener('click', (e) => {
        if (!DOM.profileDropdown.contains(e.target)) {
          DOM.dropdownMenu.classList.add('hidden');
        }
      });
    }
  }

  // ---------- Modal & button wiring ----------
  function wireModalButtons() {
    if (DOM.openAddBtn && DOM.addModal) {
      DOM.openAddBtn.addEventListener('click', () => { openModal(DOM.addModal); updateDepositDisplay(); });
    }
    if (DOM.openWithdrawBtn && DOM.withdrawModal) {
      DOM.openWithdrawBtn.addEventListener('click', () => openModal(DOM.withdrawModal));
    }
    DOM.closeButtons?.forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        closeModal(modal);
      });
    });
    [DOM.addModal, DOM.withdrawModal].forEach(modal => {
      if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    });

    if (DOM.confirmAdd) DOM.confirmAdd.addEventListener('click', handleDepositSubmit);
    if (DOM.confirmWithdraw) DOM.confirmWithdraw.addEventListener('click', handleWithdrawSubmit);

    if (DOM.coinType) DOM.coinType.addEventListener('change', updateNetworkOptions);
    if (DOM.networkType) DOM.networkType.addEventListener('change', updateDepositDisplay);
  }

  // ---------- Auth and bootstrapping ----------
  async function handleForcedLogout(message) {
    try {
      await supabase.auth.signOut();
    } catch (e) { /* ignore */ }
    // cleanup channels & redirect
    cleanupRealtime();
    alert(message || 'You have been logged out.');
    window.location.href = '../login/login.html';
  }

  async function initAuthAndStart() {
    // Load session user if exists
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('getUser error:', error);
      }
      if (!user) {
        // No active session - redirect
        console.warn('No active user session found; redirecting to login.');
        window.location.href = '../login/login.html';
        return;
      }
      // set current user and start listeners
      currentUser = user;
      await fetchUserProfileOnce(currentUser.id);
      subscribeUserProfile(currentUser.id);
      await fetchTransactionsOnce(currentUser.id);
      subscribeTransactions(currentUser.id);

      // restore notified list
      try {
        const stored = localStorage.getItem(`notifiedTransactions_${currentUser.id}`);
        if (stored) notifiedTxIds = new Set(JSON.parse(stored));
      } catch (_) {}

      // subscribe config & fetch initial
      await fetchWalletConfigOnce();
      subscribeWalletConfig();

      // set up auth state change listener for login/logout events
      const authState = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          cleanupRealtime();
          currentUser = null;
          window.location.href = '../login/login.html';
        } else if (event === 'SIGNED_IN' && session?.user) {
          currentUser = session.user;
          fetchUserProfileOnce(currentUser.id);
          subscribeUserProfile(currentUser.id);
          fetchTransactionsOnce(currentUser.id);
          subscribeTransactions(currentUser.id);
        }
      });
      // store subscription reference for cleanup
      authSubscription = authState?.data?.subscription ?? authState;
    } catch (err) {
      console.error('initAuthAndStart error', err);
      alert('Authentication error. Please log in again.');
      window.location.href = '../login/login.html';
    }
  }

  function cleanupRealtime() {
    // unsubscribe channels
    Object.keys(CHANNELS).forEach(k => {
      try {
        CHANNELS[k]?.unsubscribe?.();
      } catch (e) { /* ignore */ }
      CHANNELS[k] = null;
    });
    // unsubscribe auth
    try { authSubscription?.unsubscribe?.(); } catch (e) { /* ignore */ }
    authSubscription = null;
  }

  // ---------- Before unload cleanup ----------
  window.addEventListener('beforeunload', () => {
    cleanupRealtime();
  });

  // ---------- Boot sequence ----------
  try {
    // UI/Widgets
    initUI();
    initTradingView();
    initChart();
    wireModalButtons();

    // Wallet config & realtime
    await fetchWalletConfigOnce();
    subscribeWalletConfig();

    // Auth + realtime user/transactions
    await initAuthAndStart();

    // initial debug popup
    showPopup('Dashboard loaded — real-time enabled', true);
  } catch (err) {
    console.error('dashboard boot error', err);
  }
});