<?php
// auth.php
session_start();
require_once __DIR__ . '/config.php';

function require_login() {
    if (empty($_SESSION['user_id'])) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'messages' => ['Not authenticated.']]);
        exit;
    }
}
