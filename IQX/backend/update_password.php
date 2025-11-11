<?php
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $userId = $_POST['id'];
  $newPassword = $_POST['new_password'];

  $sql = "UPDATE users SET password='$newPassword' WHERE id=$userId";
  if (mysqli_query($conn, $sql)) {
    echo "Password updated successfully.";
  } else {
    echo "Error: " . mysqli_error($conn);
  }
}
?>
