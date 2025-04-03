-- SQL script to synchronize homieshomes_test with homieshomes
-- This script drops and recreates tables in the test database to match the main database

-- Drop all existing tables in test database to avoid constraints issues
DROP TABLE IF EXISTS `homieshomes_test`.`agent_requests`;
DROP TABLE IF EXISTS `homieshomes_test`.`bookings`;
DROP TABLE IF EXISTS `homieshomes_test`.`favourites`;
DROP TABLE IF EXISTS `homieshomes_test`.`properties`;
DROP TABLE IF EXISTS `homieshomes_test`.`users`;

-- Create users table first since other tables reference it
CREATE TABLE `homieshomes_test`.`users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_phone` varchar(50) DEFAULT NULL,
  `user_firstName` varchar(100) DEFAULT NULL,
  `user_lastName` varchar(100) DEFAULT NULL,
  `user_levels` int DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `user_email` (`user_email`)
);

-- Create agent_requests table with exact schema and foreign key constraints
CREATE TABLE `homieshomes_test`.`agent_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `request_date` datetime NOT NULL,
  `response_date` datetime DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `request_reason` text,
  PRIMARY KEY (`request_id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  CONSTRAINT `agent_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

-- Create properties table before bookings and favourites that reference it
CREATE TABLE `homieshomes_test`.`properties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `location` varchar(255) NOT NULL,
  `bedrooms` int DEFAULT NULL,
  `bathrooms` int DEFAULT NULL,
  `property_type` varchar(100) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `agent_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
);

-- Create bookings table with exact schema and foreign key constraints
CREATE TABLE `homieshomes_test`.`bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `property_id` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `booking_status` enum('pending','confirmed','cancelled','attended') DEFAULT 'pending',
  `scheduled_date` date DEFAULT NULL,
  `scheduled_time` time DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `user_id` (`user_id`),
  KEY `property_id` (`property_id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`agent_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
);

-- Create favourites table with exact schema and foreign key constraints
CREATE TABLE `homieshomes_test`.`favourites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `property_id` int NOT NULL,
  `favourited_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `property_id` (`property_id`),
  CONSTRAINT `favourites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `favourites_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
);

-- Inform user of successful synchronization
SELECT 'Test database tables have been synchronized with the main database' AS 'Success'; 