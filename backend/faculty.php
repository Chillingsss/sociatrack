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

    $sql = "SELECT a.post_id, a.post_caption, a.post_createdAt, a.post_userId, b.user_firstname, b.user_lastname, b.user_avatar, 
            GROUP_CONCAT(c.postImage_fileName) as image_files,
            COUNT(DISTINCT r.react_id) as total_reactions,
            SUM(CASE WHEN r.react_type = 'like' THEN 1 ELSE 0 END) as like_count,
            SUM(CASE WHEN r.react_type = 'love' THEN 1 ELSE 0 END) as love_count,
            SUM(CASE WHEN r.react_type = 'haha' THEN 1 ELSE 0 END) as haha_count,
            SUM(CASE WHEN r.react_type = 'sad' THEN 1 ELSE 0 END) as sad_count,
            SUM(CASE WHEN r.react_type = 'angry' THEN 1 ELSE 0 END) as angry_count,
            SUM(CASE WHEN r.react_type = 'wow' THEN 1 ELSE 0 END) as wow_count
            FROM tblpost a 
            LEFT JOIN tbluser b ON a.post_userId = b.user_id 
            LEFT JOIN tblpost_images c ON a.post_id = c.postImage_postId 
            LEFT JOIN tblreact r ON a.post_id = r.react_postId
            GROUP BY a.post_id 
            ORDER BY a.post_createdAt DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return json_encode($result);
  }

  function getPostsWithUserReactions($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    $userId = $json['user_id'];

    $sql = "SELECT a.post_id, a.post_caption, a.post_createdAt, a.post_userId, b.user_firstname, b.user_lastname, b.user_avatar, 
            GROUP_CONCAT(c.postImage_fileName) as image_files,
            COUNT(DISTINCT r.react_id) as total_reactions,
            SUM(CASE WHEN r.react_type = 'like' THEN 1 ELSE 0 END) as like_count,
            SUM(CASE WHEN r.react_type = 'love' THEN 1 ELSE 0 END) as love_count,
            SUM(CASE WHEN r.react_type = 'haha' THEN 1 ELSE 0 END) as haha_count,
            SUM(CASE WHEN r.react_type = 'sad' THEN 1 ELSE 0 END) as sad_count,
            SUM(CASE WHEN r.react_type = 'angry' THEN 1 ELSE 0 END) as angry_count,
            SUM(CASE WHEN r.react_type = 'wow' THEN 1 ELSE 0 END) as wow_count,
            ur.react_type as user_reaction
            FROM tblpost a 
            LEFT JOIN tbluser b ON a.post_userId = b.user_id 
            LEFT JOIN tblpost_images c ON a.post_id = c.postImage_postId 
            LEFT JOIN tblreact r ON a.post_id = r.react_postId
            LEFT JOIN tblreact ur ON a.post_id = ur.react_postId AND ur.react_userId = :userId
            GROUP BY a.post_id 
            ORDER BY a.post_createdAt DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':userId', $userId);
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

  function getReactPost($json = null)
  {
    include "connection.php";

    $sql = "SELECT a.react_id, a.react_type, a.react_createdAt, a.react_postId, b.user_firstname, b.user_lastname, b.user_avatar
            FROM tblreact a
            INNER JOIN tbluser b ON a.react_userId = b.user_id
            INNER JOIN tblpost c ON a.react_postId = c.post_id
            ORDER BY a.react_createdAt DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return json_encode($result);
  }

  function addReaction($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    
    // Debug logging
    error_log("addReaction called with: " . json_encode($json));
    
    try {
      // Check if user already reacted to this post
      $checkSql = "SELECT react_id, react_type FROM tblreact WHERE react_userId = :userId AND react_postId = :postId";
      $checkStmt = $conn->prepare($checkSql);
      $checkStmt->bindParam(':userId', $json['userId']);
      $checkStmt->bindParam(':postId', $json['postId']);
      $checkStmt->execute();
      $existingReaction = $checkStmt->fetch(PDO::FETCH_ASSOC);

      error_log("Existing reaction: " . json_encode($existingReaction));

      if ($existingReaction) {
        // Update existing reaction
        if ($existingReaction['react_type'] === $json['reactionType']) {
          // Remove reaction if same type clicked
          $deleteSql = "DELETE FROM tblreact WHERE react_id = :reactId";
          $deleteStmt = $conn->prepare($deleteSql);
          $deleteStmt->bindParam(':reactId', $existingReaction['react_id']);
          $deleteStmt->execute();
          error_log("Reaction removed");
          return json_encode(['success' => true, 'action' => 'removed']);
        } else {
          // Update reaction type
          $updateSql = "UPDATE tblreact SET react_type = :reactionType WHERE react_id = :reactId";
          $updateStmt = $conn->prepare($updateSql);
          $updateStmt->bindParam(':reactionType', $json['reactionType']);
          $updateStmt->bindParam(':reactId', $existingReaction['react_id']);
          $updateStmt->execute();
          error_log("Reaction updated");
          return json_encode(['success' => true, 'action' => 'updated']);
        }
      } else {
        // Add new reaction
        $insertSql = "INSERT INTO tblreact (react_userId, react_postId, react_type, react_createdAt) VALUES (:userId, :postId, :reactionType, NOW())";
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bindParam(':userId', $json['userId']);
        $insertStmt->bindParam(':postId', $json['postId']);
        $insertStmt->bindParam(':reactionType', $json['reactionType']);
        $insertStmt->execute();
        error_log("New reaction added");
        return json_encode(['success' => true, 'action' => 'added']);
      }
    } catch (Exception $e) {
      error_log("Error in addReaction: " . $e->getMessage());
      return json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
  }

  function getReactionDetails($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    $postId = $json['postId'];

    $sql = "SELECT r.react_type, u.user_firstname, u.user_lastname, u.user_avatar
            FROM tblreact r
            INNER JOIN tbluser u ON r.react_userId = u.user_id
            WHERE r.react_postId = :postId
            ORDER BY r.react_createdAt DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':postId', $postId);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group by reaction type
    $groupedReactions = [];
    foreach ($result as $reaction) {
      $type = $reaction['react_type'];
      if (!isset($groupedReactions[$type])) {
        $groupedReactions[$type] = [];
      }
      $groupedReactions[$type][] = [
        'firstname' => $reaction['user_firstname'],
        'lastname' => $reaction['user_lastname'],
        'avatar' => $reaction['user_avatar']
      ];
    }

    return json_encode($groupedReactions);
  }

  function updatePost($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    
    try {
      // First check if the user owns this post
      $checkSql = "SELECT post_userId FROM tblpost WHERE post_id = :postId";
      $checkStmt = $conn->prepare($checkSql);
      $checkStmt->bindParam(':postId', $json['postId']);
      $checkStmt->execute();
      $post = $checkStmt->fetch(PDO::FETCH_ASSOC);

      if (!$post) {
        return json_encode(['success' => false, 'error' => 'Post not found']);
      }

      if ($post['post_userId'] != $json['userId']) {
        return json_encode(['success' => false, 'error' => 'Unauthorized to edit this post']);
      }

      // Update the post caption
      $updateSql = "UPDATE tblpost SET post_caption = :caption WHERE post_id = :postId";
      $updateStmt = $conn->prepare($updateSql);
      $updateStmt->bindParam(':caption', $json['caption']);
      $updateStmt->bindParam(':postId', $json['postId']);
      $updateStmt->execute();

      return json_encode(['success' => true]);
    } catch (Exception $e) {
      return json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
  }

  function getSinglePost($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    $postId = $json['postId'];

    $sql = "SELECT a.post_id, a.post_caption, a.post_createdAt, a.post_userId, b.user_firstname, b.user_lastname, b.user_avatar, 
            GROUP_CONCAT(c.postImage_fileName) as image_files,
            COUNT(DISTINCT r.react_id) as total_reactions,
            SUM(CASE WHEN r.react_type = 'like' THEN 1 ELSE 0 END) as like_count,
            SUM(CASE WHEN r.react_type = 'love' THEN 1 ELSE 0 END) as love_count,
            SUM(CASE WHEN r.react_type = 'haha' THEN 1 ELSE 0 END) as haha_count,
            SUM(CASE WHEN r.react_type = 'sad' THEN 1 ELSE 0 END) as sad_count,
            SUM(CASE WHEN r.react_type = 'angry' THEN 1 ELSE 0 END) as angry_count,
            SUM(CASE WHEN r.react_type = 'wow' THEN 1 ELSE 0 END) as wow_count
            FROM tblpost a 
            LEFT JOIN tbluser b ON a.post_userId = b.user_id 
            LEFT JOIN tblpost_images c ON a.post_id = c.postImage_postId 
            LEFT JOIN tblreact r ON a.post_id = r.react_postId
            WHERE a.post_id = :postId
            GROUP BY a.post_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':postId', $postId);
    $stmt->execute();

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return json_encode(['post' => $result]);
  }

  function getStudentsInTribe($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    $facultyId = $json['facultyId'];

    // Get faculty's tribe ID first
    $facultySql = "SELECT user_tribeId FROM tbluser WHERE user_id = :facultyId";
    $facultyStmt = $conn->prepare($facultySql);
    $facultyStmt->bindParam(':facultyId', $facultyId);
    $facultyStmt->execute();
    $facultyData = $facultyStmt->fetch(PDO::FETCH_ASSOC);

    if (!$facultyData) {
      return json_encode([]);
    }

    // Get students in the same tribe
    $sql = "SELECT s.user_id, s.user_firstname, s.user_lastname, s.user_avatar, t.tribe_name
            FROM tbluser s
            INNER JOIN tbltribe t ON s.user_tribeId = t.tribe_id
            WHERE s.user_tribeId = :tribeId
              AND s.user_userlevelId = 3"; // Assuming 3 is student level
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':tribeId', $facultyData['user_tribeId']);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return json_encode($result);
  }

  function getAttendanceSessions()
  {
    include "connection.php";

    $sql = "SELECT attendanceS_id, attendanceS_name, attendanceS_status FROM tblattendancesession ORDER BY attendanceS_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return json_encode($result);
  }

  function getTodayAttendance($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    $facultyId = $json['facultyId'];

    // Set MySQL timezone to Philippines
    $conn->exec("SET time_zone = '+08:00'");

    // First get the faculty's tribe ID
    $facultySql = "SELECT user_tribeId FROM tbluser WHERE user_id = :facultyId";
    $facultyStmt = $conn->prepare($facultySql);
    $facultyStmt->bindParam(':facultyId', $facultyId);
    $facultyStmt->execute();
    $facultyData = $facultyStmt->fetch(PDO::FETCH_ASSOC);

    if (!$facultyData) {
      return json_encode([]);
    }

    // Get all attendance records for students in the faculty's tribe for today
    $sql = "SELECT a.*, s.user_firstname as student_firstname, s.user_lastname as student_lastname,
            COALESCE(sbo.user_firstname, faculty.user_firstname) as processor_firstname,
            COALESCE(sbo.user_lastname, faculty.user_lastname) as processor_lastname,
            COALESCE(sbo.user_userlevelId, faculty.user_userlevelId) as processor_userlevelId,
            d.userL_name as processor_role
            FROM tblattendance a
            LEFT JOIN tbluser s ON a.attendance_studentId = s.user_id
            LEFT JOIN tbluser sbo ON a.attendance_sboId = sbo.user_id
            LEFT JOIN tbluser faculty ON a.attendance_facultyId = faculty.user_id
            LEFT JOIN tbluserlevel d ON COALESCE(sbo.user_userlevelId, faculty.user_userlevelId) = d.userL_id
            WHERE DATE(a.attendance_timeIn) = CURDATE()
              AND s.user_tribeId = :tribeId
            ORDER BY a.attendance_timeIn DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':tribeId', $facultyData['user_tribeId']);
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return json_encode($result);
  }

  function processAttendance($json)
  {
    include "connection.php";

    $json = json_decode($json, true);
    $facultyId = $json['facultyId'];
    $studentId = $json['studentId'];
    $sessionId = $json['sessionId'];

    try {
      // Check if session is active
      $sessionSql = "SELECT attendanceS_status FROM tblattendancesession WHERE attendanceS_id = :sessionId";
      $sessionStmt = $conn->prepare($sessionSql);
      $sessionStmt->bindParam(':sessionId', $sessionId);
      $sessionStmt->execute();
      $session = $sessionStmt->fetch(PDO::FETCH_ASSOC);

      if (!$session || $session['attendanceS_status'] == 0) {
        return json_encode(['success' => false, 'message' => 'Session is inactive']);
      }

      // Check if student already has a record for today and this session
      $checkSql = "SELECT * FROM tblattendance 
                   WHERE attendance_studentId = :studentId 
                     AND attendance_sessionId = :sessionId 
                     AND DATE(attendance_timeIn) = CURDATE()";
      $checkStmt = $conn->prepare($checkSql);
      $checkStmt->bindParam(':studentId', $studentId);
      $checkStmt->bindParam(':sessionId', $sessionId);
      $checkStmt->execute();
      $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);

      if ($existingRecord) {
        // If already has time in but no time out, record time out
        if ($existingRecord['attendance_timeIn'] && !$existingRecord['attendance_timeOut']) {
          $updateSql = "UPDATE tblattendance 
                        SET attendance_timeOut = NOW() 
                        WHERE attendance_id = :attendanceId";
          $updateStmt = $conn->prepare($updateSql);
          $updateStmt->bindParam(':attendanceId', $existingRecord['attendance_id']);
          $updateStmt->execute();
          
          return json_encode(['success' => true, 'action' => 'time_out', 'message' => 'Time out recorded']);
        } else {
          return json_encode(['success' => false, 'message' => 'Student already completed attendance for this session']);
        }
      } else {
        // Record time in
        $insertSql = "INSERT INTO tblattendance (attendance_facultyId, attendance_studentId, attendance_sessionId, attendance_timeIn)
                      VALUES (:facultyId, :studentId, :sessionId, NOW())";
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bindParam(':facultyId', $facultyId);
        $insertStmt->bindParam(':studentId', $studentId);
        $insertStmt->bindParam(':sessionId', $sessionId);
        $insertStmt->execute();

        return json_encode(['success' => true, 'action' => 'time_in', 'message' => 'Time in recorded']);
      }
    } catch (Exception $e) {
      return json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
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
  case "getPostsWithUserReactions":
    echo $user->getPostsWithUserReactions($json);
    break;
  case "createPost":
    echo $user->createPost($json);
    break;
  case "getReactPost":
    echo $user->getReactPost($json);
    break;
  case "addReaction":
    echo $user->addReaction($json);
    break;
  case "getReactionDetails":
    echo $user->getReactionDetails($json);
    break;
  case "updatePost":
    echo $user->updatePost($json);
    break;
  case "getSinglePost":
    echo $user->getSinglePost($json);
    break;
  case "getStudentsInTribe":
    echo $user->getStudentsInTribe($json);
    break;
  case "getAttendanceSessions":
    echo $user->getAttendanceSessions();
    break;
  case "getTodayAttendance":
    echo $user->getTodayAttendance($json);
    break;
  case "processAttendance":
    echo $user->processAttendance($json);
    break;
  default:
    echo json_encode("WALA KA NAGBUTANG OG OPERATION SA UBOS HAHAHHA BOBO");
    http_response_code(400); // Bad Request
    break;
}

?>