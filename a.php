<!DOCTYPE html>
<html>
<body>

<?php
    $connection = mysql_connect("bobsboosting:3306", "user", "password") or die ('Error connecting to mysql');
    mysql_select_db("payments.db");  

    $sql = sprintf("INSERT INTO payments VALUES ('I2', 'B4', '25')");

    $result = mysql_query($sql) or die(mysql_error());

    mysql_close($connection); 
?>

</body>
</html>
