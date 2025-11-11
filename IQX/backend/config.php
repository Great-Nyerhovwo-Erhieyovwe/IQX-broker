// At top of each PHP file (during development)
header("Access-Control-Allow-Origin: https://iqx-broker.onrender.com");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }


<?php
$host = "localhost";   // Or your hosting database hostname
$user = "root";        // Your MySQL username
$pass = "IQX@404";            // Your MySQL password
$dbname = "iqx_broker";

$conn = mysqli_connect($host, $user, $pass, $dbname);

if (!$conn) {
  die("Connection failed: " . mysqli_connect_error());
}
?>
