<?php
// add_funds.php
require_once 'auth.php';
require_once 'config.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user_id'])) {
    echo json_encode(['status'=>'error','messages'=>['Not authenticated']]); exit;
}

$user_id = (int) $_SESSION['user_id'];

// get user status
$stmt = $conn->prepare("SELECT status FROM users WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) { echo json_encode(['status'=>'error','messages'=>['User not found']]); exit; }
$user = $res->fetch_assoc();
if ($user['status'] === 'banned') { echo json_encode(['status'=>'error','messages'=>['Account banned.']]); exit; }
if ($user['status'] === 'frozen') { echo json_encode(['status'=>'error','messages'=>['Account frozen. Deposits are not allowed.']]); exit; }

$coinType = trim($_POST['coinType'] ?? 'USDT');
$networkType = trim($_POST['networkType'] ?? '');
$amount = (float) ($_POST['amount'] ?? 0);

if ($amount <= 0) { echo json_encode(['status'=>'error','messages'=>['Invalid amount']]); exit; }

// create transaction (pending)
$meta = json_encode(['coin' => $coinType, 'network' => $networkType]);
$stmt = $conn->prepare("INSERT INTO transactions (user_id, type, amount, status, meta, created_at) VALUES (?, 'deposit', ?, 'pending', ?, NOW())");
$stmt->bind_param("ids", $user_id, $amount, $meta);

if ($stmt->execute()) {
    // increase deposits counter (historical deposits)
    $u = $conn->prepare("UPDATE users SET deposits = deposits + ? WHERE id = ?");
    $u->bind_param("di", $amount, $user_id);
    $u->execute();
    $u->close();

    echo json_encode(['status'=>'success','message'=>'Deposit request created. Awaiting approval.']);
} else {
    echo json_encode(['status'=>'error','messages'=>['Failed to create deposit.']]);
}
$stmt->close();
$conn->close();
