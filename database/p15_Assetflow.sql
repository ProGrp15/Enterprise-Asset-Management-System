-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: assetflow_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_chat_history`
--

DROP TABLE IF EXISTS `ai_chat_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_chat_history` (
  `chat_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`chat_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_ai_chat_company_user` (`company_id`,`user_id`,`created_at`),
  CONSTRAINT `ai_chat_history_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `ai_chat_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_chat_history`
--

LOCK TABLES `ai_chat_history` WRITE;
/*!40000 ALTER TABLE `ai_chat_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_chat_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_allocations`
--

DROP TABLE IF EXISTS `asset_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_allocations` (
  `allocation_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `allocated_by` bigint NOT NULL,
  `allocated_date` date NOT NULL,
  `expected_return_date` date DEFAULT NULL,
  `returned_date` date DEFAULT NULL,
  `allocation_status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`allocation_id`),
  KEY `asset_id` (`asset_id`),
  KEY `employee_id` (`employee_id`),
  KEY `allocated_by` (`allocated_by`),
  KEY `idx_allocation_company_status` (`company_id`,`allocation_status`),
  CONSTRAINT `asset_allocations_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `asset_allocations_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`),
  CONSTRAINT `asset_allocations_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `asset_allocations_ibfk_4` FOREIGN KEY (`allocated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_allocations`
--

LOCK TABLES `asset_allocations` WRITE;
/*!40000 ALTER TABLE `asset_allocations` DISABLE KEYS */;
INSERT INTO `asset_allocations` VALUES (1,1,1,3,2,'2026-08-05','2028-08-05',NULL,'ACTIVE','Initial allocation','2026-08-05 07:39:08'),(2,1,2,4,2,'2026-08-05','2028-08-05',NULL,'ACTIVE','Initial allocation','2026-08-05 07:39:08');
/*!40000 ALTER TABLE `asset_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_categories`
--

DROP TABLE IF EXISTS `asset_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_categories` (
  `category_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_company_name` (`company_id`,`category_name`),
  CONSTRAINT `asset_categories_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_categories`
--

LOCK TABLES `asset_categories` WRITE;
/*!40000 ALTER TABLE `asset_categories` DISABLE KEYS */;
INSERT INTO `asset_categories` VALUES (1,1,'Laptop','Portable computers',1,'2026-08-05 07:38:54','2026-08-05 07:38:54');
/*!40000 ALTER TABLE `asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_requests`
--

DROP TABLE IF EXISTS `asset_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_requests` (
  `request_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `category_id` bigint DEFAULT NULL,
  `asset_id` bigint DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `request_type` varchar(30) NOT NULL,
  `reason` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `company_id` (`company_id`),
  KEY `employee_id` (`employee_id`),
  KEY `category_id` (`category_id`),
  KEY `asset_id` (`asset_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `asset_requests_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `asset_requests_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `asset_requests_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`category_id`),
  CONSTRAINT `asset_requests_ibfk_4` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`),
  CONSTRAINT `asset_requests_ibfk_5` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_requests`
--

LOCK TABLES `asset_requests` WRITE;
/*!40000 ALTER TABLE `asset_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_returns`
--

DROP TABLE IF EXISTS `asset_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_returns` (
  `return_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `requested_by` bigint DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `condition_status` varchar(30) DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `returned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`return_id`),
  KEY `company_id` (`company_id`),
  KEY `asset_id` (`asset_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `asset_returns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `asset_returns_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`),
  CONSTRAINT `asset_returns_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_returns`
--

LOCK TABLES `asset_returns` WRITE;
/*!40000 ALTER TABLE `asset_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_transfers`
--

DROP TABLE IF EXISTS `asset_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_transfers` (
  `transfer_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `from_employee_id` bigint DEFAULT NULL,
  `to_employee_id` bigint DEFAULT NULL,
  `from_location_id` bigint DEFAULT NULL,
  `to_location_id` bigint DEFAULT NULL,
  `requested_by` bigint DEFAULT NULL,
  `approved_by` bigint DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `reason` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`transfer_id`),
  KEY `company_id` (`company_id`),
  KEY `asset_id` (`asset_id`),
  KEY `from_location_id` (`from_location_id`),
  KEY `to_location_id` (`to_location_id`),
  CONSTRAINT `asset_transfers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `asset_transfers_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`),
  CONSTRAINT `asset_transfers_ibfk_3` FOREIGN KEY (`from_location_id`) REFERENCES `locations` (`location_id`),
  CONSTRAINT `asset_transfers_ibfk_4` FOREIGN KEY (`to_location_id`) REFERENCES `locations` (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_transfers`
--

LOCK TABLES `asset_transfers` WRITE;
/*!40000 ALTER TABLE `asset_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `asset_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  `vendor_id` bigint NOT NULL,
  `location_id` bigint DEFAULT NULL,
  `purchase_order_id` bigint DEFAULT NULL,
  `asset_name` varchar(150) NOT NULL,
  `asset_tag` varchar(80) NOT NULL,
  `serial_number` varchar(120) NOT NULL,
  `manufacturer` varchar(120) DEFAULT NULL,
  `model` varchar(120) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_cost` decimal(14,2) DEFAULT NULL,
  `warranty_expiry` date DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'AVAILABLE',
  `remarks` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`asset_id`),
  UNIQUE KEY `uq_asset_company_tag` (`company_id`,`asset_tag`),
  UNIQUE KEY `uq_asset_company_serial` (`company_id`,`serial_number`),
  KEY `category_id` (`category_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `location_id` (`location_id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`category_id`),
  CONSTRAINT `assets_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`vendor_id`),
  CONSTRAINT `assets_ibfk_4` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE SET NULL,
  CONSTRAINT `assets_ibfk_5` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`purchase_order_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES (1,1,1,1,1,1,'Dell Latitude 7440','XYZ-LAP-001','XYZSN001','Dell','Latitude 7440','2026-08-05',100000.00,'2029-08-04','ASSIGNED','Assigned to Aarav',1,'2026-08-05 07:38:54','2026-08-05 07:39:08'),(2,1,1,1,1,1,'Dell Latitude 7440','XYZ-LAP-002','XYZSN002','Dell','Latitude 7440','2026-08-05',100000.00,'2029-08-04','ASSIGNED','Assigned to Diya',1,'2026-08-05 07:38:54','2026-08-05 07:39:08');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `audit_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `module` varchar(100) NOT NULL,
  `action` varchar(255) NOT NULL,
  `entity_id` bigint DEFAULT NULL,
  `description` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `company_id` (`company_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,2,'department','CREATE',1,'Created department',NULL,'2026-08-05 07:38:34'),(2,1,2,'employee','CREATE',3,'Created employee',NULL,'2026-08-05 07:38:34'),(3,1,2,'employee','CREATE',4,'Created employee',NULL,'2026-08-05 07:38:34'),(4,1,2,'employee','CREATE',5,'Created employee',NULL,'2026-08-05 07:38:35'),(5,1,2,'employee','CREATE',6,'Created employee',NULL,'2026-08-05 07:38:35'),(6,1,2,'category','CREATE',NULL,'Created category',NULL,'2026-08-05 07:38:54'),(7,1,2,'vendor','CREATE',NULL,'Created vendor',NULL,'2026-08-05 07:38:54'),(8,1,2,'location','CREATE',1,'Created location',NULL,'2026-08-05 07:38:54'),(9,1,2,'purchase-order','CREATE',NULL,'Created purchase-order',NULL,'2026-08-05 07:38:54'),(10,1,2,'asset','CREATE',NULL,'Created asset',NULL,'2026-08-05 07:38:54'),(11,1,2,'asset','CREATE',NULL,'Created asset',NULL,'2026-08-05 07:38:54'),(12,1,2,'asset-allocation','CREATE',NULL,'Created asset-allocation',NULL,'2026-08-05 07:39:08'),(13,1,2,'asset-allocation','CREATE',NULL,'Created asset-allocation',NULL,'2026-08-05 07:39:08');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `company_id` bigint NOT NULL AUTO_INCREMENT,
  `company_name` varchar(150) NOT NULL,
  `company_email` varchar(120) NOT NULL,
  `company_phone` varchar(30) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `organization_size` varchar(30) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`company_id`),
  UNIQUE KEY `company_email` (`company_email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'XYZ','admin@xyz.com','9000000001','Technology','SMALL','XYZ Office','Pune','Maharashtra','India','411001',1,'2026-08-05 07:38:19','2026-08-05 07:38:19');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `department_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `uq_department_company_name` (`company_id`,`department_name`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,1,'Operations','XYZ operations',1,'2026-08-05 07:38:34','2026-08-05 07:38:34');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `location_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `location_name` varchar(120) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `uq_location_company_name` (`company_id`,`location_name`),
  CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,1,'XYZ Pune Office','Tech Park','Pune','Maharashtra','India','411001',1,'2026-08-05 07:38:54','2026-08-05 07:38:54');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance`
--

DROP TABLE IF EXISTS `maintenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance` (
  `maintenance_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `employee_id` bigint NOT NULL,
  `issue_description` text NOT NULL,
  `priority` varchar(20) NOT NULL DEFAULT 'MEDIUM',
  `status` varchar(30) NOT NULL DEFAULT 'OPEN',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`maintenance_id`),
  KEY `company_id` (`company_id`),
  KEY `asset_id` (`asset_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `maintenance_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `maintenance_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`),
  CONSTRAINT `maintenance_ibfk_3` FOREIGN KEY (`employee_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance`
--

LOCK TABLES `maintenance` WRITE;
/*!40000 ALTER TABLE `maintenance` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `company_id` (`company_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,3,'AssetFlow update','Your asset allocation has been updated.',0,'2026-08-05 07:39:08'),(2,1,4,'AssetFlow update','Your asset allocation has been updated.',0,'2026-08-05 07:39:08');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `token_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `consumed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `purchase_order_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `vendor_id` bigint NOT NULL,
  `order_number` varchar(100) NOT NULL,
  `order_date` date DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `total_amount` decimal(14,2) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'DRAFT',
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`purchase_order_id`),
  UNIQUE KEY `uq_po_company_number` (`company_id`,`order_number`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,1,1,'XYZ-PO-001','2026-08-05','2026-08-12',200000.00,'RECEIVED','Initial laptop purchase','2026-08-05 07:38:54','2026-08-05 07:38:54');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repair_history`
--

DROP TABLE IF EXISTS `repair_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repair_history` (
  `repair_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `asset_id` bigint NOT NULL,
  `technician_id` bigint DEFAULT NULL,
  `issue_description` varchar(500) NOT NULL,
  `repair_action` varchar(1000) DEFAULT NULL,
  `cost` decimal(14,2) DEFAULT NULL,
  `started_at` date DEFAULT NULL,
  `completed_at` date DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'OPEN',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`repair_id`),
  KEY `company_id` (`company_id`),
  KEY `asset_id` (`asset_id`),
  KEY `technician_id` (`technician_id`),
  CONSTRAINT `repair_history_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `repair_history_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`),
  CONSTRAINT `repair_history_ibfk_3` FOREIGN KEY (`technician_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repair_history`
--

LOCK TABLES `repair_history` WRITE;
/*!40000 ALTER TABLE `repair_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `repair_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (4,'SUPER_ADMIN','Platform owner','2026-08-05 07:34:41'),(5,'COMPANY_ADMIN','Company administrator','2026-08-05 07:34:41'),(6,'EMPLOYEE','Employee','2026-08-05 07:34:41');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint DEFAULT NULL,
  `department_id` bigint DEFAULT NULL,
  `role_id` bigint NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `company_id` (`company_id`),
  KEY `department_id` (`department_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,NULL,4,'Super','Admin','superadmin@assetflow.in','$2a$10$d5NWLk68PZBMLHsbNc01bOQ.Yv3Wh1R8fwafwt0tlEVxI0oDIhEyS','9999999999',1,'2026-08-05 07:37:22','2026-08-05 07:37:22'),(2,1,NULL,5,'XYZ','Admin','admin@xyz.com','$2a$10$HYCUT9y/ZXgIq3xNJZ6FM.s7bMroCNWw.MOAeTlh/zVyeD25BDkRa','9000000001',1,'2026-08-05 07:38:19','2026-08-05 07:38:19'),(3,1,1,6,'Aarav','Sharma','aarav@xyz.com','$2a$10$HtsV7EouAhB8IPmuhnZQheY9rSRq94wo7wAz0sqN2lS80f/uD.cQe','9000000011',1,'2026-08-05 07:38:34','2026-08-05 07:38:34'),(4,1,1,6,'Diya','Patel','diya@xyz.com','$2a$10$R5EQyZveZ10G6YfZgqHIWuy1oF3avhJOK1pHiqcyjAAMAk29Wi2ea','9000000012',1,'2026-08-05 07:38:34','2026-08-05 07:38:34'),(5,1,1,6,'Kabir','Mehta','kabir@xyz.com','$2a$10$wERbNNCIv3Vwtin0sxS3jeDPYWAftB/pHQ11RAvojQteQOH2UtRfu','9000000013',1,'2026-08-05 07:38:35','2026-08-05 07:38:35'),(6,1,1,6,'Meera','Joshi','meera@xyz.com','$2a$10$QyaBfIQzyI7oCYGdm8rpxOfejC2caBKPOuoOsI6y0eUrZHlFDvP4O','9000000014',1,'2026-08-05 07:38:35','2026-08-05 07:38:35');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `vendor_id` bigint NOT NULL AUTO_INCREMENT,
  `company_id` bigint NOT NULL,
  `vendor_name` varchar(120) NOT NULL,
  `contact_person` varchar(120) DEFAULT NULL,
  `email` varchar(160) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`vendor_id`),
  UNIQUE KEY `uq_vendor_company_name` (`company_id`,`vendor_name`),
  CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (1,1,'Dell','Dell Support','support@dell.example','9000000100','India',1,'2026-08-05 07:38:54','2026-08-05 07:38:54');
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-05 20:52:09
