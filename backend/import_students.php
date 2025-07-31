<?php
include "headers.php";

// Set timezone to Philippines
date_default_timezone_set('Asia/Manila');

class StudentImporter {
    

    
    function parseFullName($fullName) {
        $parts = explode(',', $fullName);
        $lastName = trim($parts[0] ?? '');
        
        if (count($parts) > 1) {
            $remaining = trim($parts[1]);
            $nameParts = explode(' ', $remaining);
            $firstName = trim($nameParts[0] ?? '');
            $middleName = trim(implode(' ', array_slice($nameParts, 1)) ?? '');
        } else {
            $nameParts = explode(' ', $fullName);
            $firstName = trim($nameParts[0] ?? '');
            $lastName = trim($nameParts[count($nameParts) - 1] ?? '');
            $middleName = count($nameParts) > 2 ? trim(implode(' ', array_slice($nameParts, 1, -1))) : '';
        }
        
        return [
            'firstName' => $firstName,
            'middleName' => $middleName,
            'lastName' => $lastName
        ];
    }
    
    function generateEmail($firstName, $lastName, $lrn) {
        $baseEmail = strtolower($firstName . '.' . $lastName);
        $baseEmail = preg_replace('/[^a-z0-9.]/', '', $baseEmail);
        return $baseEmail . '@student.mogchs.edu.ph';
    }
    
    function parseDate($dateString) {
        if (empty($dateString)) return null;
        
        try {
            $date = new DateTime($dateString);
            return $date->format('Y-m-d');
        } catch (Exception $e) {
            return null;
        }
    }
}

// Get operation from multiple sources
$operation = $_GET['operation'] ?? $_POST['operation'] ?? '';

// Handle JSON input for savePreviewedStudents
$json = null;
if ($operation === 'savePreviewedStudents' || empty($operation)) {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $json = json_decode($input, true);
        if ($json && isset($json['operation'])) {
            $operation = $json['operation'];
        }
    }
}

$importer = new StudentImporter();

// Handle savePreviewedStudents operation
if ($operation === 'savePreviewedStudents') {
    include "connection.php";
    
    $data = $json['data'] ?? [];
    $headers = $json['headers'] ?? [];
    $sectionId = $json['sectionId'] ?? '';
    $importUserId = $json['userId'] ?? '';
    
    if (empty($data) || empty($headers)) {
        echo json_encode([
            'success' => false,
            'error' => 'No data or headers provided'
        ]);
        exit;
    }
    
    if (empty($sectionId)) {
        echo json_encode([
            'success' => false,
            'error' => 'Section ID is required'
        ]);
        exit;
    }
    
    if (empty($importUserId)) {
        echo json_encode([
            'success' => false,
            'error' => 'User ID is required'
        ]);
        exit;
    }
    
    $importedCount = 0;
    $errors = [];
    
    // Helper function to find header value by partial match
    function findHeader($rowAssoc, $searchTerms) {
        foreach ($searchTerms as $term) {
            foreach ($rowAssoc as $key => $value) {
                if (strpos($key, strtoupper($term)) !== false) {
                    return $value;
                }
            }
        }
        return '';
    }
    
    try {
        $conn->beginTransaction();
        $defaultUserLevel = 4;
        
        // Default values for tblsfrecord
        $defaultFileName = 'SF-10-SHS-Senior-High-School-Student-Permanent-Record.xlsx';
        $defaultGradeLevelId = 1;
        
        foreach ($data as $rowIndex => $row) {
            // Map columns by header name (flexible)
            $rowAssoc = array();
            foreach ($headers as $i => $header) {
                $rowAssoc[strtoupper(trim($header))] = isset($row[$i]) ? trim($row[$i]) : '';
            }
            
            $lrn = findHeader($rowAssoc, ['LRN']);
            $fullName = findHeader($rowAssoc, ['NAME']);
            $birthDate = findHeader($rowAssoc, ['BIRTH DATE']);
            $age = findHeader($rowAssoc, ['AGE']);
            $religion = findHeader($rowAssoc, ['RELIGIOUS']);
            $completeAddress = findHeader($rowAssoc, ['HOUSE', 'ADDRESS']);
            $fatherName = findHeader($rowAssoc, ['FATHER']);
            $motherName = findHeader($rowAssoc, ['MOTHER']);
            $guardianName = findHeader($rowAssoc, ['GUARDIAN']);
            $relationship = findHeader($rowAssoc, ['RELATIONSHIP']);
            $track = findHeader($rowAssoc, ['TRACK']);
            $strand = findHeader($rowAssoc, ['STRAND']);
            
            // Validate required fields
            if (empty($lrn) || empty($fullName)) {
                $errors[] = "Row " . ($rowIndex + 1) . ": LRN and Name are required";
                continue;
            }
            
            // Parse the full name into components
            $nameParts = $importer->parseFullName($fullName);
            $firstName = $nameParts['firstName'];
            $middleName = $nameParts['middleName'];
            $lastName = $nameParts['lastName'];
            
            // Generate email from name if not provided
            $email = $importer->generateEmail($firstName, $lastName, $lrn);
            
            // Generate default password using lastName
            $defaultPassword = password_hash($lastName, PASSWORD_DEFAULT);
            
            // Generate fileName with student's last name
            $studentFileName = 'SF-10-SHS-Senior-High-School-Student-Permanent-Record' . '.xlsx';
            
            // Check if student already exists
            $checkSql = "SELECT id FROM tblstudent WHERE lrn = :lrn";
            $checkStmt = $conn->prepare($checkSql);
            $checkStmt->bindParam(':lrn', $lrn);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                $errors[] = "Row " . ($rowIndex + 1) . ": Student with LRN $lrn already exists";
                continue;
            }
            
            // Insert student data
            $sql = "INSERT INTO tblstudent (
                id, firstname, middlename, lastname, lrn, email, password, 
                userLevel, track, strand, birthDate, age, religion, 
                completeAddress, fatherName, motherName, guardianName, 
                guardianRelationship, sectionId, createdAt
            ) VALUES (
                :id, :firstname, :middlename, :lastname, :lrn, :email, :password,
                :userLevel, :track, :strand, :birthDate, :age, :religion,
                :completeAddress, :fatherName, :motherName, :guardianName,
                :guardianRelationship, :sectionId, NOW()
            )";
            
            $stmt = $conn->prepare($sql);
            $studentId = $lrn;
            $stmt->bindParam(':id', $studentId);
            $stmt->bindParam(':firstname', $firstName);
            $stmt->bindParam(':middlename', $middleName);
            $stmt->bindParam(':lastname', $lastName);
            $stmt->bindParam(':lrn', $lrn);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $defaultPassword);
            $stmt->bindParam(':userLevel', $defaultUserLevel);
            $stmt->bindParam(':track', $track);
            $stmt->bindParam(':strand', $strand);
            $stmt->bindParam(':birthDate', $birthDate);
            $stmt->bindParam(':age', $age);
            $stmt->bindParam(':religion', $religion);
            $stmt->bindParam(':completeAddress', $completeAddress);
            $stmt->bindParam(':fatherName', $fatherName);
            $stmt->bindParam(':motherName', $motherName);
            $stmt->bindParam(':guardianName', $guardianName);
            $stmt->bindParam(':guardianRelationship', $relationship);
            $stmt->bindParam(':sectionId', $sectionId);
            
            if ($stmt->execute()) {
                // Insert into tblsfrecord after successful student insertion
                $sfRecordSql = "INSERT INTO tblsfrecord (
                    fileName, studentId, gradeLevelId, userId, createdAt
                ) VALUES (
                    :fileName, :studentId, :gradeLevelId, :userId, NOW()
                )";
                
                $sfRecordStmt = $conn->prepare($sfRecordSql);
                $sfRecordStmt->bindParam(':fileName', $studentFileName); // Using the personalized fileName
                $sfRecordStmt->bindParam(':studentId', $lrn); // Using LRN as studentId
                $sfRecordStmt->bindParam(':gradeLevelId', $defaultGradeLevelId);
                $sfRecordStmt->bindParam(':userId', $importUserId);
                
                if ($sfRecordStmt->execute()) {
                    $importedCount++;
                } else {
                    $errors[] = "Row " . ($rowIndex + 1) . ": Student $fullName inserted but failed to create SF record";
                    $importedCount++; // Still count as imported since student was created
                }
            } else {
                $errors[] = "Row " . ($rowIndex + 1) . ": Failed to insert student $fullName";
            }
        }
        
        $conn->commit();
        echo json_encode([
            'success' => true,
            'imported' => $importedCount,
            'errors' => $errors,
            'message' => "Successfully imported $importedCount students"
        ]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode([
            'success' => false,
            'error' => 'Import failed: ' . $e->getMessage()
        ]);
    }
    exit;
}

switch ($operation) {
    case "downloadTemplate":
        $importer->generateCSVTemplate();
        break;
    default:
        echo json_encode(['error' => 'Invalid operation']);
        http_response_code(400);
        break;
}
?> 