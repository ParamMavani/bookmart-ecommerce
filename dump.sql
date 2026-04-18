-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: bookmart
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;

--
-- GTID state at the beginning of the backup 
--


--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (5,1,5,1),(6,1,4,1);
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Fiction','fiction'),(2,'Science & Tech','science-tech'),(3,'Self-Help','self-help'),(4,'History','history'),(5,'Business','business');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,1,39.99),(2,2,2,1,45.00),(3,3,4,1,20.00),(4,4,2,1,45.00),(5,4,8,1,22.00),(6,5,8,1,22.00),(7,6,2,1,45.00),(8,7,4,1,20.00),(9,8,4,1,20.00),(10,8,5,1,24.99),(11,9,4,1,20.00),(12,9,2,1,45.00),(13,10,4,1,20.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','cancelled','refunded') DEFAULT 'pending',
  `shipping_name` varchar(100) DEFAULT NULL,
  `shipping_email` varchar(100) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_zip` varchar(20) DEFAULT NULL,
  `shipping_country` varchar(50) DEFAULT NULL,
  `paypal_order_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_state` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,3,39.99,3.20,43.19,'paid','Jane Smith','jane@example.com','123 Tech Lane','San Francisco','10001','US',NULL,'2026-04-12 13:40:54',NULL),(2,2,45.00,3.60,48.60,'pending','John Doe','john@example.com','456 Fiction Blvd','Seattle','94105','US',NULL,'2026-04-12 13:40:54',NULL),(3,2,20.00,1.60,21.60,'paid','John Doe','john@example.com','123 Main St, Apt 4B','New York','10001','US','2NY84406EN9995151','2026-04-18 11:24:36',NULL),(4,4,67.00,5.36,72.36,'paid','Param Mavani','parammavani16@gmail.com','123 Main St, Apt 4B','New York','10001','US','8S707701M3934664G','2026-04-18 11:31:06',NULL),(5,4,22.00,1.76,23.76,'paid','Param Mavani','parammavani16@gmail.com','123 Main St, Apt 4B','New York','10001','US','09C1043795992800W','2026-04-18 11:40:16',NULL),(6,4,45.00,3.60,48.60,'paid','Param Mavani','parammavani16@gmail.com','123 Main St, Apt 4B','New York','10001','US','2UT688352V125672W','2026-04-18 11:50:59',NULL),(7,4,20.00,1.60,21.60,'pending','Param Mavani','parammavani16@gmail.com','123 Main St, Apt 4B','New York','10001','US',NULL,'2026-04-18 11:55:53',NULL),(8,4,44.99,3.60,48.59,'pending','Param Mavani','parammavani16@gmail.com','123 Main St, Apt 4B','New York','10001','US',NULL,'2026-04-18 11:58:49',NULL),(9,4,65.00,5.20,70.20,'pending','Param Mavani','parammavani16@gmail.com','123 Main St, Apt 4B','New York','10001','US',NULL,'2026-04-18 12:08:17',NULL),(10,6,20.00,1.60,21.60,'pending','Param Patel','pmavani06@gmail.com','123 Main St, Apt 4B','New York','10001','US',NULL,'2026-04-18 14:05:02',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `author` varchar(100) DEFAULT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `image_url` varchar(255) DEFAULT NULL,
  `isbn` varchar(50) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT '4.0',
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Exp','Exp','Exp',200.00,4,'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg','123',4.0,3),(2,'Clean Code','Robert C. Martin','Agile Software Craftsmanship.',45.00,27,'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',NULL,4.9,2),(3,'Dune','Frank Herbert','Science fiction masterpiece.',15.99,100,'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',NULL,4.7,1),(4,'Atomic Habits','James Clear','Build Good Habits.',20.00,195,'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',NULL,4.9,3),(5,'Sapiens','Yuval Noah Harari','A Brief History of Humankind.',24.99,79,'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',NULL,4.8,4),(6,'1984','George Orwell','Dystopian novel.',12.99,45,'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',NULL,4.6,1),(7,'Think and Grow Rich','Napoleon Hill','Classic wealth book.',14.50,60,'https://covers.openlibrary.org/b/isbn/9781585424337-L.jpg',NULL,4.5,5),(8,'Steve Jobs','Walter Isaacson','Biography of Apple co-founder.',22.00,38,'https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg',NULL,4.7,5);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','admin') DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `zip` varchar(20) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Store Admin','admin@bookmart.com','$2b$10$MpmtPBIgrfD2XGQg5VvSw.oPJuOx8LHnc2l91WDbmNFmdnU8.2QrG','admin','2026-04-12 13:13:28',NULL,NULL,NULL,NULL,NULL,1),(2,'John Doe','john@example.com','$2b$10$gdfTh96UOCmdWJWdB/biw./MYrEyV3I223IsdDwZHAmD6i.qa/n8S','customer','2026-04-12 13:40:54',NULL,NULL,NULL,NULL,NULL,1),(3,'Jane Smith','jane@example.com','$2b$10$gdfTh96UOCmdWJWdB/biw./MYrEyV3I223IsdDwZHAmD6i.qa/n8S','customer','2026-04-12 13:40:54',NULL,NULL,NULL,NULL,NULL,1),(4,'Param Mavani','parammavani16@gmail.com','$2b$10$7AwxaBZ.b8PTxC5.AHw3jOtiBK7DTZSRhmfK.Aj.Mbwj3Rvoq4MC.','customer','2026-04-15 17:04:33',NULL,NULL,NULL,NULL,NULL,1),(6,'Param Patel','pmavani06@gmail.com','$2b$10$mG8fRfqkTrbbz/PtCyc5nO.2z7MAynlWBjGJV45bZfauXQn5.IVKm','customer','2026-04-18 14:04:15',NULL,NULL,NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-18 22:04:53
