// reset_password.php
require 'connect.php';

$input = json_decode(file_get_contents('php://input'), true);
$token = $input['token'] ?? '';
$newPassword = $input['password'] ?? '';

$stmt = $pdo->prepare("SELECT user_id, expires_at FROM password_resets WHERE token = ?");
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row || strtotime($row['expires_at']) < time()) {
  http_response_code(400); echo json_encode(['error'=>'Invalid or expired token']);
  exit;
}

$hash = password_hash($newPassword, PASSWORD_DEFAULT);
$pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $row['user_id']]);
$pdo->prepare("DELETE FROM password_resets WHERE token = ?")->execute([$token]);
echo json_encode(['success'=>true]);
