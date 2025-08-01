<?php
include "headers.php";

class User {
  function login($json)
{
    include "connection.php";

    $json = json_decode($json, true);

    $sql = "SELECT a.user_id, a.user_firstname, a.user_lastname, a.user_email, a.user_password, b.userL_name AS userLevel FROM tbluser a
            INNER JOIN tbluserlevel b ON a.user_userlevelId = b.userL_id
            WHERE BINARY a.user_id = :username";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':username', $json['username']);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (password_verify($json['password'], $user['user_password'])) {
            return json_encode([
                'user_id' => $user['user_id'],
                'userLevel' => $user['userLevel'],
                'user_firstname' => $user['user_firstname'],
                'user_lastname' => $user['user_lastname'],
                'user_email' => $user['user_email']
            ]);
        }
    }

    return json_encode(null);
} 
}

$operation = isset($_POST["operation"]) ? $_POST["operation"] : "0";
$json = isset($_POST["json"]) ? $_POST["json"] : "0";

$user = new User();

switch ($operation) {
  case "login":
    echo $user->login($json);
    break;
  default:
    echo json_encode("WALA KA NAGBUTANG OG OPERATION SA UBOS HAHAHHA BOBO");
    http_response_code(400); // Bad Request
    break;
}

?>