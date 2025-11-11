<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'connect.php';
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['error'=>'Not authenticated']); exit; }

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$full_name = trim($input['full_name'] ?? null);
$phone = trim($input['phone'] ?? null);
$country = trim($input['country'] ?? null);
$currency = trim($input['currency'] ?? null);

$fields = [];
$params = [];

if ($full_name !== null) { $fields[] = "full_name = ?"; $params[] = $full_name; }
if ($phone !== null) { $fields[] = "phone = ?"; $params[] = $phone; }
if ($country !== null) { $fields[] = "country = ?"; $params[] = $country; }
if ($currency !== null) { $fields[] = "currency = ?"; $params[] = $currency; }

if (empty($fields)) { http_response_code(400); echo json_encode(['error'=>'No fields to update']); exit; }

$params[] = $_SESSION['user_id'];
$sql = "UPDATE users SET ".implode(', ', $fields)." WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode(['success'=>true]);
