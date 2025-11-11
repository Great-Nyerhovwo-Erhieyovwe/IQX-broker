<?php
require_once 'config.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $full_name = trim($_POST['fullName'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $account_type = $_POST['accountType'] ?? '';
    $country = $_POST['country'] ?? '';
    $currency = $_POST['currency'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirmPassword'] ?? '';
    $terms = isset($_POST['terms']);
    $age_confirm = isset($_POST['agree']);

    $errors = [];

    // --- Basic validations ---
    if (!$full_name || strlen($full_name) < 3) $errors[] = "Full name must be at least 3 characters.";
    if (!$username || strlen($username) < 4) $errors[] = "Username must be at least 4 characters.";
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "Valid email is required.";
    if (!$password) $errors[] = "Password is required.";
    if ($password !== $confirm_password) $errors[] = "Passwords do not match.";
    if (!$terms) $errors[] = "You must agree to the terms.";
    if (!$age_confirm) $errors[] = "You must confirm you are 18+.";

    if ($errors) {
        echo json_encode(["status" => "error", "messages" => $errors]);
        exit;
    }

    // --- Check email uniqueness ---
    $stmt = $conn->prepare("SELECT id FROM users WHERE email=? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(["status" => "error", "messages" => ["Email already registered."]]);
        exit;
    }
    $stmt->close();

    // --- Check username uniqueness ---
    $stmt = $conn->prepare("SELECT id FROM users WHERE username=? LIMIT 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        echo json_encode(["status" => "error", "messages" => ["Username already taken."]]);
        exit;
    }
    $stmt->close();

    // --- Insert user ---
    $stmt = $conn->prepare("INSERT INTO users (full_name, username, email, phone, account_type, country, currency, password, balance, roi, deposits, active_trades, is_frozen, is_banned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?)");
    $created_at = date('Y-m-d H:i:s');
    $stmt->bind_param(
        "sssssssss",
        $full_name,
        $username,
        $email,
        $phone,
        $account_type,
        $country,
        $currency,
        $password, // ✅ Plain-text password
        $created_at
    );

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Registration successful!"]);
    } else {
        echo json_encode(["status" => "error", "messages" => ["Failed to register. Please try again."]]);
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["status" => "error", "messages" => ["Invalid request method."]]);
}
