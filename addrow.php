<?php
$mysqli = new mysqli("localhost", null, null, "C:\Code\PythonStuff\website\payments.db");
if($mysqli->connect_error) {
  exit('Could not connect');
}

$sql = sprintf("INSERT INTO payments VALUES ('I2', 'B4', '25')");

$stmt = $mysqli->prepare($sql);
$stmt->execute();
$stmt->close();

echo "<table>";
echo "<tr>";
echo "<th>CustomerID</th>";
echo "<td>" . $cid . "</td>";
echo "<th>CompanyName</th>";
echo "<td>" . $cname . "</td>";
echo "<th>ContactName</th>";
echo "<td>" . $name . "</td>";
echo "<th>Address</th>";
echo "<td>" . $adr . "</td>";
echo "<th>City</th>";
echo "<td>" . $city . "</td>";
echo "<th>PostalCode</th>";
echo "<td>" . $pcode . "</td>";
echo "<th>Country</th>";
echo "<td>" . $country . "</td>";
echo "</tr>";
echo "</table>";
?> 