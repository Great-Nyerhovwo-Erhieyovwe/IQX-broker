// admin_reset_request.php (server-side only, protected)
require 'connect.php'; // PDO $pdo

$userId = intval($_POST['user_id']);
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

$stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
$stmt->execute([$userId, $token, $expires]);

// send email with link: https://your-site.com/reset-password.html?token=$token
// Use your SMTP provider (PHPMailer) — do NOT include password in email.
