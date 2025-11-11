<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'connect.php';
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$type = $input['type'] ?? '';
$amount = (float)($input['amount'] ?? 0);

if (!in_array($type, ['deposit','withdrawal','trade']) || $amount <= 0) { http_response_code(400); echo json_encode(['error'=>'Invalid transaction']); exit; }

$stmt = $pdo->prepare("INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, 'pending')");
$stmt->execute([$_SESSION['user_id'], $type, $amount]);

echo json_encode(['success'=>true, 'transaction_id'=>$pdo->lastInsertId()]);
