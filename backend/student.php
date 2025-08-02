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

    function getComment($json)
    {
      include "connection.php";

      $json = json_decode($json, true);
      
      // Set MySQL timezone to Philippines
      $conn->exec("SET time_zone = '+08:00'");

      $sql = "SELECT a.comment_id, a.comment_message, a.comment_createdAt, b.user_firstname, b.user_lastname, b.user_avatar
              FROM tblcomment a
              INNER JOIN tbluser b ON a.comment_userId = b.user_id
              WHERE a.comment_postId = :post_id
              ORDER BY a.comment_createdAt ASC";
      $stmt = $conn->prepare($sql);
      $stmt->bindParam(':post_id', $json['post_id']);
      $stmt->execute();

      $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
      return json_encode($result);
    }
    function addComment($json)
    {
      include "connection.php";

      $json = json_decode($json, true);
      
      // Set MySQL timezone to Philippines
      $conn->exec("SET time_zone = '+08:00'");
      
      $sql = "INSERT INTO tblcomment (comment_message, comment_userId, comment_postId, comment_createdAt) VALUES (:comment_message, :comment_userId, :comment_postId, NOW())";
      $stmt = $conn->prepare($sql);
      $stmt->bindParam(':comment_message', $json['comment_message']);
      $stmt->bindParam(':comment_userId', $json['comment_userId']);
      $stmt->bindParam(':comment_postId', $json['comment_postId']);
      
      if ($stmt->execute()) {
        return json_encode(array("success" => true, "message" => "Comment added successfully"));
      } else {
        return json_encode(array("success" => false, "message" => "Failed to add comment"));
      }
    }

    function getStudentAttendanceRecords($json)
    {
      include "connection.php";

      $json = json_decode($json, true);
      $studentId = $json['studentId'];

      // Set MySQL timezone to Philippines
      $conn->exec("SET time_zone = '+08:00'");

      $sql = "SELECT a.*, b.attendanceS_name as session_name, c.user_firstname, c.user_lastname, d.userL_name
              FROM tblattendance a
              INNER JOIN tblattendancesession b ON a.attendance_sessionId = b.attendanceS_id
              INNER JOIN tbluser c ON a.attendance_facultyId = c.user_id
              INNER JOIN tbluserlevel d ON c.user_userlevelId = d.userL_id
              WHERE a.attendance_studentId = :studentId
              ORDER BY a.attendance_timeIn DESC";
      $stmt = $conn->prepare($sql);
      $stmt->bindParam(':studentId', $studentId);
      $stmt->execute();

      $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
      return json_encode($result);
    }
  }

  $operation = isset($_POST["operation"]) ? $_POST["operation"] : "0";
  $json = isset($_POST["json"]) ? $_POST["json"] : "0";

  $user = new User();

  switch ($operation) {
    case "getProfile":
      echo $user->getProfile($json);
      break;
    case "getComment":
      echo $user->getComment($json);
      break;
    case "addComment":
      echo $user->addComment($json);
      break;
    case "getStudentAttendanceRecords":
      echo $user->getStudentAttendanceRecords($json);
      break;
    default:
      echo json_encode("WALA KA NAGBUTANG OG OPERATION SA UBOS HAHAHHA BOBO");
      http_response_code(400); // Bad Request
      break;
  }

  ?>