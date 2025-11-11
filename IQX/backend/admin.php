<?php
include 'config.php';
session_start();

// You can protect this page with a simple admin login
// e.g., $_SESSION['is_admin'] == true

$result = mysqli_query($conn, "SELECT * FROM users");
?>

<h2>Registered Users</h2>
<table border="1" cellpadding="10">
  <tr>
    <th>ID</th>
    <th>Full Name</th>
    <th>Email</th>
    <th>Password (Visible)</th>
    <th>Balance</th>
    <th>Created</th>
  </tr>

  <?php while($row = mysqli_fetch_assoc($result)): ?>
  <tr>
    <td><?= $row['id'] ?></td>
    <td><?= $row['fullname'] ?></td>
    <td><?= $row['email'] ?></td>
    <td><?= $row['password'] ?></td>
    <td><?= $row['balance'] ?></td>
    <td><?= $row['created_at'] ?></td>
  </tr>
  <?php endwhile; ?>
</table>
