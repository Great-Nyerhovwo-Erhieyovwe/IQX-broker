<?php
// get_dashboard_data.php
require_once 'auth.php';
require_once 'config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    echo json_encode(['status'=>'error','messages'=>['Not authenticated']]);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

// fetch user
$stmt = $conn->prepare("SELECT id, fullname, username, email, phone, account_type, country, currency, balance, roi, deposits, active_trades, status, ban_reason, frozen_reason, created_at FROM users WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$userRes = $stmt->get_result();
$user = $userRes->fetch_assoc();
$stmt->close();

// fetch recent transactions (limit 20)
$stmt = $conn->prepare("SELECT id, type, amount, status, meta, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$txRes = $stmt->get_result();
$transactions = [];
while ($r = $txRes->fetch_assoc()) {
    $r['meta'] = $r['meta'] ? json_decode($r['meta'], true) : null;
    $transactions[] = $r;
}
$stmt->close();
$conn->close();

echo json_encode([
    'status'=>'success',
    'user' => $user,
    'transactions' => $transactions
]);
