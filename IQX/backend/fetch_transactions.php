<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'connect.php';
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }

$stmt = $pdo->prepare("SELECT id, type, amount, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$_SESSION['user_id']]);
$tx = $stmt->fetchAll();

echo json_encode(['transactions'=>$tx]);
