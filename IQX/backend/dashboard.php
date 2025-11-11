<?php
// dashboard.php
require_once 'config.php';
session_start();

// Redirect if not logged in
if (empty($_SESSION['user_id'])) {
    header('Location: ../login/login.html');
    exit;
}

$user_id = (int) $_SESSION['user_id'];

// Fetch user info
$stmt = $conn->prepare("
    SELECT id, fullname, username, email, phone, account_type, country, currency, balance, roi, deposits, active_trades, status, ban_reason, frozen_reason, created_at
    FROM users
    WHERE id = ?
    LIMIT 1
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    session_unset();
    session_destroy();
    header('Location: ../login/login.html');
    exit;
}

$user = $res->fetch_assoc();
$stmt->close();

// Check if banned or frozen
if ($user['status'] === 'banned' || $user['status'] === 'frozen') {
    session_unset();
    session_destroy();
    $msg = $user['status'] === 'banned' ? 'banned' : 'frozen';
    header("Location: ../login/login.html?msg=$msg");
    exit;
}

// Fetch last 5 transactions
$stmt = $conn->prepare("
    SELECT type, amount, status, created_at
    FROM transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$tx_res = $stmt->get_result();
$transactions = $tx_res->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$conn->close();

// Prepare user data for JavaScript if needed
$jsUser = [
    'id' => (int)$user['id'],
    'fullname' => $user['fullname'],
    'username' => $user['username'],
    'email' => $user['email'],
    'phone' => $user['phone'],
    'account_type' => $user['account_type'],
    'country' => $user['country'],
    'currency' => $user['currency'],
    'balance' => (float)$user['balance'],
    'roi' => (float)$user['roi'],
    'deposits' => (float)$user['deposits'],
    'active_trades' => (int)$user['active_trades'],
    'status' => $user['status'],
    'ban_reason' => $user['ban_reason'],
    'frozen_reason' => $user['frozen_reason'],
    'created_at' => $user['created_at'],
];
?>
