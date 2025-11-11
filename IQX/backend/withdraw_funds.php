<?php
// withdraw_funds.php
require_once 'auth.php';
require_once 'config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    echo json_encode(['status'=>'error','messages'=>['Not authenticated']]); exit;
}

$user_id = (int) $_SESSION['user_id'];

// get user and balance
$stmt = $conn->prepare("SELECT balance, status FROM users WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) { echo json_encode(['status'=>'error','messages'=>['User not found']]); exit; }
$user = $res->fetch_assoc();

if ($user['status'] === 'banned') { echo json_encode(['status'=>'error','messages'=>['Account banned.']]); exit; }
if ($user['status'] === 'frozen') { echo json_encode(['status'=>'error','messages'=>['Account frozen. Withdrawals are not allowed.']]); exit; }

$wallet = trim($_POST['wallet'] ?? '');
$network = trim($_POST['network'] ?? '');
$amount = (float) ($_POST['amount'] ?? 0);

if ($amount <= 0) { echo json_encode(['status'=>'error','messages'=>['Invalid amount']]); exit; }
if ($amount > (float)$user['balance']) { echo json_encode(['status'=>'error','messages'=>['Insufficient balance']]); exit; }

// create withdrawal transaction (pending)
$meta = json_encode(['wallet' => $wallet, 'network' => $network]);
$stmt = $conn->prepare("INSERT INTO transactions (user_id, type, amount, status, meta, created_at) VALUES (?, 'withdrawal', ?, 'pending', ?, NOW())");
$stmt->bind_param("ids", $user_id, $amount, $meta);

if ($stmt->execute()) {
    // deduct from balance (reserve)
    $u = $conn->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
    $u->bind_param("di", $amount, $user_id);
    $u->execute();
    $u->close();

    echo json_encode(['status'=>'success','message'=>'Withdrawal request submitted.']);
} else {
    echo json_encode(['status'=>'error','messages'=>['Failed to create withdrawal.']]);
}
$stmt->close();
$conn->close();
