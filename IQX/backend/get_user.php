<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'connect.php';

if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }

$stmt = $pdo->prepare("SELECT id, email, username, full_name, balance, roi, deposits, active_trades, country, currency, account_type, is_frozen, is_banned FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();
if (!$user) { http_response_code(404); echo json_encode(['error'=>'User not found']); exit; }

echo json_encode(['user'=>$user]);
