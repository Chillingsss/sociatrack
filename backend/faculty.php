<?php
include "headers.php";

class User {
  function getProfile($json)
  {
    include "connection.php";

    $json = json_decode($json, true);

    $sql = "SELECT * FROM tbluser WHERE user_id = :user_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $json['user_id']);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return json_encode($result);
  }

  function getPosts()
  {
    include "connection.php";

    $sql = "SELECT a.post_id, a.post_caption, a.post_createdAt, b.user_firstname, b.user_lastname, b.user_avatar, 
            GROUP_CONCAT(c.postImage_fileName) as image_files
            FROM tblpost a 
            LEFT JOIN tbluser b ON a.post_userId = b.user_id 
            LEFT JOIN tblpost_images c ON a.post_id = c.postImage_postId 
            GROUP BY a.post_id 
            ORDER BY a.post_createdAt DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return json_encode($result);
  }

  function createPost($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    
    try {
      $conn->beginTransaction();

      // Insert post
      $sql = "INSERT INTO tblpost (post_caption, post_userId, post_createdAt) VALUES (:caption, :userId, NOW())";
      $stmt = $conn->prepare($sql);
      $stmt->bindParam(':caption', $json['caption']);
      $stmt->bindParam(':userId', $json['userId']);
      $stmt->execute();
      
      $postId = $conn->lastInsertId();

      // Handle multiple images
      if (isset($json['images']) && is_array($json['images'])) {
        foreach ($json['images'] as $imageFileName) {
          $sql = "INSERT INTO tblpost_images (postImage_fileName, postImage_postId) VALUES (:imageFileName, :postId)";
          $stmt = $conn->prepare($sql);
          $stmt->bindParam(':postId', $postId);
          $stmt->bindParam(':imageFileName', $imageFileName);
          $stmt->execute();
        }
      }

      $conn->commit();
      return json_encode(['success' => true, 'post_id' => $postId]);
    } catch (Exception $e) {
      $conn->rollback();
      return json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
  }
}

$operation = isset($_POST["operation"]) ? $_POST["operation"] : "0";
$json = isset($_POST["json"]) ? $_POST["json"] : "0";

$user = new User();

switch ($operation) {
  case "login":
    echo $user->login($json);
    break;
  case "getProfile":
    echo $user->getProfile($json);
    break;
  case "getPosts":
    echo $user->getPosts();
    break;
  case "createPost":
    echo $user->createPost($json);
    break;
  default:
    echo json_encode("WALA KA NAGBUTANG OG OPERATION SA UBOS HAHAHHA BOBO");
    http_response_code(400); // Bad Request
    break;
}

?>