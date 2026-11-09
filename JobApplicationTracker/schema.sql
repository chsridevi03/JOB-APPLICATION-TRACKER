-- ====================================================================
-- JOB APPLICATION TRACKER (JOBTRACK) - MYSQL DATABASE SCHEMA & SEED DATA
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `jobtrack_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jobtrack_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Notification Preferences Table
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `email_on_selected` BOOLEAN DEFAULT TRUE,
  `email_on_rejected` BOOLEAN DEFAULT TRUE,
  `email_interview_reminder` BOOLEAN DEFAULT TRUE,
  `interview_reminder_days` INT DEFAULT 2,
  CONSTRAINT `fk_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Companies Table
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `company_name` VARCHAR(150) NOT NULL,
  `website` VARCHAR(255) NULL,
  `location` VARCHAR(150) NULL,
  `contact_email` VARCHAR(150) NULL,
  `phone` VARCHAR(50) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_company_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_comp_name` (`company_name`),
  INDEX `idx_comp_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Applications Table
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `company_id` INT NOT NULL,
  `job_position` VARCHAR(150) NOT NULL,
  `application_date` VARCHAR(50) NOT NULL,
  `interview_date` VARCHAR(50) NULL,
  `job_description` TEXT NULL,
  `job_location` VARCHAR(150) DEFAULT 'Remote',
  `job_type` VARCHAR(50) DEFAULT 'Full-time', -- Full-time, Part-time, Internship, Contract
  `salary` VARCHAR(100) NULL,
  `status` VARCHAR(50) DEFAULT 'Applied', -- Applied, Interview, Selected, Rejected, On Hold
  `on_hold_reason` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_app_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  INDEX `idx_app_status` (`status`),
  INDEX `idx_app_user` (`user_id`),
  INDEX `idx_app_date` (`application_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Application Status History Table
CREATE TABLE IF NOT EXISTS `application_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT NOT NULL,
  `previous_status` VARCHAR(50) NOT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `reason` TEXT NULL,
  `changed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_hist_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  INDEX `idx_hist_app` (`application_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Application Documents Table (Resumes, Cover Letters, Portfolios, Offer Letters)
CREATE TABLE IF NOT EXISTS `application_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `doc_type` VARCHAR(50) DEFAULT 'resume',
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` INT DEFAULT 0,
  `mime_type` VARCHAR(100) DEFAULT 'application/pdf',
  `file_data` LONGTEXT NOT NULL, -- Stored Base64 or local filepath
  `uploaded_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_doc_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_doc_app` (`application_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Email Notification Logs Table
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `application_id` INT NULL,
  `recipient_email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `trigger_type` VARCHAR(50) NOT NULL, -- status_selected, status_rejected, interview_reminder, test
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) DEFAULT 'delivered',
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL,
  INDEX `idx_notif_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================================
-- SAMPLE SEED DATA
-- ====================================================================

-- Demo User (Password: password123)
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `created_at`)
VALUES (1, 'Sarah Connor', 'demo@jobtrack.io', 'pbkdf2_$c39f1e1a$a2b4c6e8f0123456789abcdef0123456789abcdef0123456789abcdef0123456', NOW())
ON DUPLICATE KEY UPDATE `email`=`email`;

INSERT INTO `notification_preferences` (`user_id`, `email_on_selected`, `email_on_rejected`, `email_interview_reminder`, `interview_reminder_days`)
VALUES (1, 1, 1, 1, 2)
ON DUPLICATE KEY UPDATE `email_on_selected`=1;

-- Seed Companies
INSERT INTO `companies` (`id`, `user_id`, `company_name`, `website`, `location`, `contact_email`, `phone`, `description`)
VALUES
  (1, 1, 'Stripe', 'https://stripe.com', 'San Francisco, CA (Remote)', 'talent@stripe.com', '+1 (415) 555-0199', 'Global financial infrastructure provider.'),
  (2, 1, 'Linear', 'https://linear.app', 'Remote', 'jobs@linear.app', '+1 (650) 555-0120', 'Issue tracking and roadmaps for high performance teams.'),
  (3, 1, 'Figma', 'https://figma.com', 'San Francisco, CA', 'careers@figma.com', '+1 (415) 555-0144', 'Collaborative interface design software.'),
  (4, 1, 'Datadog', 'https://datadoghq.com', 'New York, NY', 'recruiting@datadoghq.com', '+1 (212) 555-0182', 'Cloud infrastructure observability and analytics.'),
  (5, 1, 'Airbnb', 'https://airbnb.com', 'San Francisco, CA', 'talent@airbnb.com', '+1 (415) 555-0112', 'Vacation rentals and travel accommodation.')
ON DUPLICATE KEY UPDATE `company_name`=VALUES(`company_name`);

-- Seed Applications
INSERT INTO `applications` (`id`, `user_id`, `company_id`, `job_position`, `application_date`, `interview_date`, `job_description`, `job_location`, `job_type`, `salary`, `status`, `on_hold_reason`)
VALUES
  (1, 1, 1, 'Senior Frontend Engineer', '2026-10-12', '2026-11-12', 'Lead checkout and design systems in React and TypeScript', 'San Francisco, CA (Remote)', 'Full-time', '$180,000 - $210,000', 'Interview', NULL),
  (2, 1, 2, 'Full-Stack Product Engineer', '2026-10-16', NULL, 'Build desktop client and fast synchronization engine', 'Remote', 'Full-time', '$175,000 - $200,000', 'Selected', NULL),
  (3, 1, 3, 'Design Systems Architect', '2026-10-20', NULL, 'Develop WebGL canvas components and token management', 'San Francisco, CA', 'Full-time', '$190,000 - $225,000', 'On Hold', 'Company postponed recruitment due to Q4 headcount realignment.'),
  (4, 1, 4, 'Cloud Reliability Specialist', '2026-10-22', NULL, 'Manage Kubernetes observability and incident telemetry', 'New York, NY', 'Full-time', '$165,000 - $185,000', 'Rejected', NULL),
  (5, 1, 5, 'Staff Web Platform Engineer', '2026-10-30', NULL, 'SSR architecture and design system scaling', 'San Francisco, CA', 'Full-time', '$200,000 - $230,000', 'Applied', NULL)
ON DUPLICATE KEY UPDATE `job_position`=VALUES(`job_position`);

-- Seed Status History
INSERT INTO `application_status_history` (`application_id`, `previous_status`, `new_status`, `reason`, `changed_at`)
VALUES
  (1, 'Initial', 'Applied', 'Applied on Stripe website', '2026-10-12 10:00:00'),
  (1, 'Applied', 'Interview', 'Passed recruiter phone screen, scheduled architecture interview', '2026-11-04 14:30:00'),
  (2, 'Initial', 'Applied', 'Referred by teammate', '2026-10-16 09:00:00'),
  (2, 'Applied', 'Interview', 'System design interview completed', '2026-10-28 11:00:00'),
  (2, 'Interview', 'Selected', 'Formal written offer received!', '2026-11-07 16:00:00'),
  (3, 'Initial', 'Applied', 'Application submitted with portfolio', '2026-10-20 15:00:00'),
  (3, 'Applied', 'On Hold', 'Company postponed recruitment due to Q4 headcount realignment.', '2026-11-04 09:30:00'),
  (4, 'Initial', 'Applied', 'Application submitted online', '2026-10-22 13:00:00'),
  (4, 'Applied', 'Rejected', 'Position filled by internal candidate', '2026-11-01 17:00:00');
