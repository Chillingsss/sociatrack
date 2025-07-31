<?php
include "headers.php";

// Set upload directory
$uploadDir = "uploads/";

// Create uploads directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Check if file was uploaded
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['file'];
    
    // Get file info
    $fileName = $file['name'];
    $fileSize = $file['size'];
    $fileTmpName = $file['tmp_name'];
    $fileType = $file['type'];
    
    // Get file extension
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Allowed file types
    $allowedExtensions = array('jpg', 'jpeg', 'png', 'gif', 'webp');
    
    // Validate file type
    if (!in_array($fileExtension, $allowedExtensions)) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid file type. Only JPG, JPEG, PNG, GIF, and WebP are allowed.'
        ]);
        exit;
    }
    
    // Validate file size (5MB max)
    if ($fileSize > 5 * 1024 * 1024) {
        echo json_encode([
            'success' => false,
            'error' => 'File size too large. Maximum size is 5MB.'
        ]);
        exit;
    }
    
    // Generate unique filename
    $uniqueFileName = uniqid() . '_' . time() . '.' . $fileExtension;
    $uploadPath = $uploadDir . $uniqueFileName;
    
    // Move uploaded file to uploads directory
    if (move_uploaded_file($fileTmpName, $uploadPath)) {
        echo json_encode([
            'success' => true,
            'fileName' => $uniqueFileName,
            'originalName' => $fileName,
            'fileSize' => $fileSize,
            'fileType' => $fileType
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to upload file.'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'No file uploaded or upload error occurred.'
    ]);
}
?> 