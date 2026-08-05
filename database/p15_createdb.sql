-- AssetFlow canonical schema (approved modules only).
CREATE DATABASE IF NOT EXISTS assetflow_db;
USE assetflow_db;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS ai_chat_history, password_reset_tokens, audit_logs, notifications,
  repair_history, asset_returns, asset_transfers, maintenance, asset_requests,
  asset_allocations, assets, purchase_orders, locations, vendors, asset_categories,
  departments, users, companies, roles;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE roles (
  role_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE companies (
  company_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  company_email VARCHAR(120) NOT NULL UNIQUE,
  company_phone VARCHAR(30), industry VARCHAR(100), organization_size VARCHAR(30),
  address TEXT, city VARCHAR(100), state VARCHAR(100), country VARCHAR(100), postal_code VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE departments (
  department_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  description VARCHAR(255), is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_department_company_name(company_id, department_name),
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NULL, department_id BIGINT NULL, role_id BIGINT NOT NULL,
  first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
  phone VARCHAR(30), is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY(department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY(role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB;

CREATE TABLE asset_categories (
  category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NOT NULL, category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255), is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_category_company_name(company_id, category_name),
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE vendors (
  vendor_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NOT NULL, vendor_name VARCHAR(120) NOT NULL,
  contact_person VARCHAR(120), email VARCHAR(160), phone VARCHAR(30), address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vendor_company_name(company_id, vendor_name),
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE locations (
  location_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NOT NULL, location_name VARCHAR(120) NOT NULL,
  address TEXT, city VARCHAR(100), state VARCHAR(100), country VARCHAR(100), postal_code VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_location_company_name(company_id, location_name),
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
  purchase_order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NOT NULL, vendor_id BIGINT NOT NULL,
  order_number VARCHAR(100) NOT NULL, order_date DATE, expected_delivery_date DATE,
  total_amount DECIMAL(14,2), status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_po_company_number(company_id, order_number),
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY(vendor_id) REFERENCES vendors(vendor_id)
) ENGINE=InnoDB;

CREATE TABLE assets (
  asset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT NOT NULL, category_id BIGINT NOT NULL, vendor_id BIGINT NOT NULL,
  location_id BIGINT NULL, purchase_order_id BIGINT NULL,
  asset_name VARCHAR(150) NOT NULL, asset_tag VARCHAR(80) NOT NULL, serial_number VARCHAR(120) NOT NULL,
  manufacturer VARCHAR(120), model VARCHAR(120), purchase_date DATE, purchase_cost DECIMAL(14,2),
  warranty_expiry DATE, status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', remarks TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asset_company_tag(company_id, asset_tag), UNIQUE KEY uq_asset_company_serial(company_id, serial_number),
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES asset_categories(category_id), FOREIGN KEY(vendor_id) REFERENCES vendors(vendor_id),
  FOREIGN KEY(location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
  FOREIGN KEY(purchase_order_id) REFERENCES purchase_orders(purchase_order_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE asset_allocations (
  allocation_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, asset_id BIGINT NOT NULL,
  employee_id BIGINT NOT NULL, allocated_by BIGINT NOT NULL, allocated_date DATE NOT NULL,
  expected_return_date DATE, returned_date DATE, allocation_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY(asset_id) REFERENCES assets(asset_id), FOREIGN KEY(employee_id) REFERENCES users(user_id), FOREIGN KEY(allocated_by) REFERENCES users(user_id),
  INDEX idx_allocation_company_status(company_id, allocation_status)
) ENGINE=InnoDB;

CREATE TABLE asset_requests (
  request_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, employee_id BIGINT NOT NULL,
  category_id BIGINT NULL, asset_id BIGINT NULL, approved_by BIGINT NULL,
  request_type VARCHAR(30) NOT NULL, reason TEXT NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(employee_id) REFERENCES users(user_id),
  FOREIGN KEY(category_id) REFERENCES asset_categories(category_id), FOREIGN KEY(asset_id) REFERENCES assets(asset_id), FOREIGN KEY(approved_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE maintenance (
  maintenance_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, asset_id BIGINT NOT NULL, employee_id BIGINT NOT NULL,
  issue_description TEXT NOT NULL, priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, resolved_at TIMESTAMP NULL,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(asset_id) REFERENCES assets(asset_id), FOREIGN KEY(employee_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE asset_transfers (
  transfer_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, asset_id BIGINT NOT NULL,
  from_employee_id BIGINT, to_employee_id BIGINT, from_location_id BIGINT, to_location_id BIGINT,
  requested_by BIGINT, approved_by BIGINT, status VARCHAR(30) NOT NULL DEFAULT 'PENDING', reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(asset_id) REFERENCES assets(asset_id),
  FOREIGN KEY(from_location_id) REFERENCES locations(location_id), FOREIGN KEY(to_location_id) REFERENCES locations(location_id)
) ENGINE=InnoDB;

CREATE TABLE asset_returns (
  return_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, asset_id BIGINT NOT NULL, employee_id BIGINT NOT NULL,
  requested_by BIGINT, approved_by BIGINT, condition_status VARCHAR(30), remarks VARCHAR(500), status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  returned_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(asset_id) REFERENCES assets(asset_id), FOREIGN KEY(employee_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE repair_history (
  repair_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, asset_id BIGINT NOT NULL, technician_id BIGINT,
  issue_description VARCHAR(500) NOT NULL, repair_action VARCHAR(1000), cost DECIMAL(14,2), started_at DATE, completed_at DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(asset_id) REFERENCES assets(asset_id), FOREIGN KEY(technician_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  notification_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, user_id BIGINT NOT NULL,
  title VARCHAR(150) NOT NULL, message TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, user_id BIGINT NOT NULL,
  module VARCHAR(100) NOT NULL, action VARCHAR(255) NOT NULL, entity_id BIGINT, description TEXT, ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
  token_id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL, consumed_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ai_chat_history (
  chat_id BIGINT AUTO_INCREMENT PRIMARY KEY, company_id BIGINT NOT NULL, user_id BIGINT NOT NULL,
  question TEXT NOT NULL, answer TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(company_id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_ai_chat_company_user(company_id, user_id, created_at)
) ENGINE=InnoDB;
