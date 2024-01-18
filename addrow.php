<?php
$mysqli = new mysqli("localhost", null, null, "C:\Code\PythonStuff\website\payments.db");
if($mysqli->connect_error) {
  exit('Could not connect');
}

$sql = sprintf("INSERT INTO payments VALUES ('I2', 'B4', '25')");

$stmt = $mysqli->prepare($sql);
$stmt->execute();
$stmt->close();
?> 