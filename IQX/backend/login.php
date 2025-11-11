<?php
require_once 'config.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $remember = isset($_POST['remember-me']);

    $errors = [];
    if (!$email) $errors[] = "Email is required.";
    if (!$password) $errors[] = "Password is required.";

    if ($errors) {
        echo json_encode(["status" => "error", "messages" => $errors]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, username, password, is_banned, is_frozen FROM users WHERE email=? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["status" => "error", "messages" => ["Invalid email or password."]]);
        exit;
    }

    $user = $result->fetch_assoc();

    if ($password !== $user['password']) {
        echo json_encode(["status" => "error", "messages" => ["Invalid email or password."]]);
        exit;
    }

    // Save session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['is_banned'] = $user['is_banned'];
    $_SESSION['is_frozen'] = $user['is_frozen'];

    if ($remember) {
        setcookie("user_id", $user['id'], time() + 7*24*60*60, "/");
        setcookie("username", $user['username'], time() + 7*24*60*60, "/");
    }

    echo json_encode([
        "status" => "success",
        "username" => $user['username'],
        "is_banned" => (bool)$user['is_banned'],
        "is_frozen" => (bool)$user['is_frozen']
    ]);

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["status" => "error", "messages" => ["Invalid request method."]]);
}
