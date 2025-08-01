-- Database schema for Facebook-style reactions
-- Add this table to your existing database

CREATE TABLE IF NOT EXISTS `tblreact` (
  `react_id` int(11) NOT NULL AUTO_INCREMENT,
  `react_userId` int(11) NOT NULL,
  `react_postId` int(11) NOT NULL,
  `react_type` enum('like','love','haha','sad','angry','wow') NOT NULL DEFAULT 'like',
  `react_createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`react_id`),
  UNIQUE KEY `unique_user_post_reaction` (`react_userId`, `react_postId`),
  KEY `react_postId` (`react_postId`),
  KEY `react_userId` (`react_userId`),
  CONSTRAINT `fk_react_post` FOREIGN KEY (`react_postId`) REFERENCES `tblpost` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_react_user` FOREIGN KEY (`react_userId`) REFERENCES `tbluser` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data (optional - for testing)
-- INSERT INTO `tblreact` (`react_userId`, `react_postId`, `react_type`) VALUES
-- (1, 1, 'like'),
-- (2, 1, 'love'),
-- (3, 1, 'haha'),
-- (1, 2, 'sad'),
-- (2, 2, 'angry'),
-- (3, 2, 'wow'); 