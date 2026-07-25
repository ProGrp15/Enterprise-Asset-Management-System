-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: p15_assetflow
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
-- Dumping data for table `asset`
--

LOCK TABLES `asset` WRITE;
/*!40000 ALTER TABLE `asset` DISABLE KEYS */;
INSERT INTO `asset` VALUES (1,1,1,1,1,'Dell Latitude 5440','AST-TN-1001','DL5440-SN001','2024-02-15',78500.00,'ALLOCATED'),(2,1,1,1,1,'Dell Latitude 5440','AST-TN-1002','DL5440-SN002','2024-02-15',78500.00,'AVAILABLE'),(3,1,2,1,2,'Dell 24-inch Monitor','AST-TN-1003','DLM24-SN010','2024-03-10',12500.00,'ALLOCATED'),(4,1,3,2,1,'Cisco Catalyst Switch 24-Port','AST-TN-1004','CSC24-SN055','2023-11-20',145000.00,'MAINTENANCE'),(5,2,4,3,3,'Mahindra 575 DI Tractor','AST-GF-2001','MH575-SN021','2023-06-05',650000.00,'ALLOCATED'),(6,2,5,4,3,'Jain Drip Irrigation Kit','AST-GF-2002','JDI-SN044','2024-01-18',45000.00,'AVAILABLE'),(7,3,6,5,5,'Caterpillar 320 Excavator','AST-BR-3001','CAT320-SN012','2022-09-01',4500000.00,'ALLOCATED'),(8,3,7,6,5,'3M Safety Helmet Set (Box of 20)','AST-BR-3002','3MSH-SN099','2024-04-25',18000.00,'AVAILABLE'),(9,3,6,5,6,'Caterpillar Backhoe Loader','AST-BR-3003','CATBH-SN033','2023-03-14',3200000.00,'SCRAPPED');
/*!40000 ALTER TABLE `asset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `asset_allocation`
--

LOCK TABLES `asset_allocation` WRITE;
/*!40000 ALTER TABLE `asset_allocation` DISABLE KEYS */;
INSERT INTO `asset_allocation` VALUES (1,1,3,'2026-01-10',NULL,NULL,'ALLOCATED'),(2,3,4,'2026-02-05',NULL,NULL,'ALLOCATED'),(3,5,6,'2025-07-01',NULL,NULL,'ALLOCATED'),(4,7,8,'2024-09-15',NULL,NULL,'ALLOCATED'),(5,4,5,'2025-12-01','2026-06-01','2026-05-28','RETURNED');
/*!40000 ALTER TABLE `asset_allocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `asset_category`
--

LOCK TABLES `asset_category` WRITE;
/*!40000 ALTER TABLE `asset_category` DISABLE KEYS */;
INSERT INTO `asset_category` VALUES (1,1,'Laptops'),(2,1,'Monitors'),(3,1,'Networking Equipment'),(4,2,'Tractors & Machinery'),(5,2,'Irrigation Equipment'),(6,3,'Heavy Machinery'),(7,3,'Safety Equipment');
/*!40000 ALTER TABLE `asset_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `asset_request`
--

LOCK TABLES `asset_request` WRITE;
/*!40000 ALTER TABLE `asset_request` DISABLE KEYS */;
INSERT INTO `asset_request` VALUES (1,2,3,'2026-06-01','Need a laptop for new project onboarding','APPROVED'),(2,6,7,'2026-06-10','Irrigation kit required for new farm plot','PENDING'),(3,8,9,'2026-06-15','Additional safety helmets needed for new hires','APPROVED'),(4,3,4,'2026-06-18','Monitor required for dual-screen setup','REJECTED');
/*!40000 ALTER TABLE `asset_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,1,NULL,'LOGIN','Authentication','Super admin Pushkar Chaudhari logged into the system','192.168.1.10','2026-07-03 11:54:51'),(2,2,1,'ASSET_ALLOCATED','Asset Management','Allocated Dell Latitude 5440 to Rohit Verma','192.168.1.22','2026-07-03 11:54:51'),(3,6,5,'ASSET_CREATED','Asset Management','Added new Mahindra 575 DI Tractor to inventory','192.168.2.15','2026-07-03 11:54:51'),(4,8,9,'ASSET_SCRAPPED','Asset Management','Marked Caterpillar Backhoe Loader as scrapped','192.168.3.30','2026-07-03 11:54:51'),(5,1,NULL,'COMPANY_CREATED','Company Management','Onboarded new company BuildRight Constructions','192.168.1.10','2026-07-03 11:54:51');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `company`
--

LOCK TABLES `company` WRITE;
/*!40000 ALTER TABLE `company` DISABLE KEYS */;
INSERT INTO `company` VALUES (1,'TechNova Solutions','Information Technology','201-500','contact@technova.com','9876543210'),(2,'GreenField Agro Pvt Ltd','Agriculture','51-200','info@greenfieldagro.com','9123456780'),(3,'BuildRight Constructions','Construction','501-1000','admin@buildright.com','9988776655');
/*!40000 ALTER TABLE `company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `department`
--

LOCK TABLES `department` WRITE;
/*!40000 ALTER TABLE `department` DISABLE KEYS */;
INSERT INTO `department` VALUES (1,1,'Information Technology'),(2,1,'Human Resources'),(3,1,'Finance'),(4,2,'Field Operations'),(5,2,'Sales & Marketing'),(6,3,'Site Engineering'),(7,3,'Procurement');
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `location`
--

LOCK TABLES `location` WRITE;
/*!40000 ALTER TABLE `location` DISABLE KEYS */;
INSERT INTO `location` VALUES (1,1,'Pune Head Office'),(2,1,'Bangalore Branch'),(3,2,'Nashik Farm Unit'),(4,2,'Nagpur Warehouse'),(5,3,'Mumbai Site A'),(6,3,'Pune Site B');
/*!40000 ALTER TABLE `location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `maintenance`
--

LOCK TABLES `maintenance` WRITE;
/*!40000 ALTER TABLE `maintenance` DISABLE KEYS */;
INSERT INTO `maintenance` VALUES (1,4,2,'2026-06-20',3500.00,'Firmware upgrade and port diagnostics','IN_PROGRESS'),(2,7,5,'2026-05-10',25000.00,'Hydraulic system routine service','COMPLETED'),(3,9,5,'2025-11-01',12000.00,'Engine inspection before decommission','COMPLETED'),(4,1,1,'2026-07-01',0.00,'Warranty checkup and battery health scan','SCHEDULED');
/*!40000 ALTER TABLE `maintenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,1,NULL,'Welcome to AssetFlow','Hello Pushkar, your SUPER_ADMIN account has been set up successfully.',1,'2026-07-03 11:54:51'),(2,3,1,'Asset Allocated','Dell Latitude 5440 (AST-TN-1001) has been allocated to you.',1,'2026-07-03 11:54:51'),(3,7,6,'Request Pending','Your request for Jain Drip Irrigation Kit is pending approval.',0,'2026-07-03 11:54:51'),(4,9,8,'Request Approved','Your request for additional safety helmets has been approved.',0,'2026-07-03 11:54:51'),(5,4,4,'Maintenance Scheduled','Cisco Catalyst Switch is currently under maintenance.',0,'2026-07-03 11:54:51');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `purchase_order`
--

LOCK TABLES `purchase_order` WRITE;
/*!40000 ALTER TABLE `purchase_order` DISABLE KEYS */;
INSERT INTO `purchase_order` VALUES (1,1,1,'2024-02-01',157000.00,'DELIVERED'),(2,1,2,'2023-11-05',145000.00,'DELIVERED'),(3,2,3,'2023-05-20',650000.00,'DELIVERED'),(4,2,4,'2026-06-25',45000.00,'PENDING'),(5,3,5,'2026-06-28',4500000.00,'APPROVED');
/*!40000 ALTER TABLE `purchase_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,NULL,NULL,'Pushkar Chaudhari','pushkar.chaudhari@assetflow.com','hashed_password_superadmin','SUPER_ADMIN'),(2,1,1,'Ananya Sharma','ananya.sharma@technova.com','hashed_password_001','COMPANY_ADMIN'),(3,1,1,'Rohit Verma','rohit.verma@technova.com','hashed_password_002','EMPLOYEE'),(4,1,2,'Priya Iyer','priya.iyer@technova.com','hashed_password_003','EMPLOYEE'),(5,1,3,'Karan Mehta','karan.mehta@technova.com','hashed_password_004','EMPLOYEE'),(6,2,4,'Suresh Patil','suresh.patil@greenfieldagro.com','hashed_password_005','COMPANY_ADMIN'),(7,2,5,'Neha Deshmukh','neha.deshmukh@greenfieldagro.com','hashed_password_006','EMPLOYEE'),(8,3,6,'Vikram Singh','vikram.singh@buildright.com','hashed_password_007','COMPANY_ADMIN'),(9,3,7,'Arjun Nair','arjun.nair@buildright.com','hashed_password_008','EMPLOYEE');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `vendor`
--

LOCK TABLES `vendor` WRITE;
/*!40000 ALTER TABLE `vendor` DISABLE KEYS */;
INSERT INTO `vendor` VALUES (1,1,'Dell Technologies','sales@dell.com','18002024260'),(2,1,'Cisco Systems India','support@cisco.com','18004257788'),(3,2,'Mahindra Agri Equipment','sales@mahindraagri.com','18001021555'),(4,2,'Jain Irrigation Systems','contact@jains.com','18002333444'),(5,3,'Caterpillar India','info@caterpillar.com','18003094567'),(6,3,'3M Safety India','safety@3m.com','18002099887');
/*!40000 ALTER TABLE `vendor` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-03 17:25:24
