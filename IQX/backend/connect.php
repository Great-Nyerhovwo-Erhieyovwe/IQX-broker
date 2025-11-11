<?php
// connect.php - put outside public root if possible.
$DB_HOST = 'localhost';           // your host
$DB_NAME = 'iqx_broker';          // database name
$DB_USER = 'db_user';             // db username
$DB_PASS = 'IQX@404';         // db password
$DSN = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";

$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES => false,
];

try {
  $pdo = new PDO($DSN, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Database connection failed: '.$e->getMessage()]);
  exit;
}
