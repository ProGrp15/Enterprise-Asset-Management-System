-- AssetFlow Database Version 1.0 - Schema Creation
-- Auto-generated schema script for assetflow_db

DROP DATABASE IF EXISTS assetflow_db;
CREATE DATABASE assetflow_db;
USE assetflow_db;

-- 1. roles
CREATE TABLE roles (
    role_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default System Roles
INSERT INTO roles (role_name, description) VALUES
('SUPER_ADMIN', 'Platform Super Administrator with system-wide access'),
('COMPANY_ADMIN', 'Company Administrator managing organization assets, users, and settings'),
('EMPLOYEE', 'Standard Employee user requesting and utilizing assigned assets');

-- 2. companies
CREATE TABLE companies (
    company_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    company_email VARCHAR(120) NOT NULL UNIQUE,
    company_phone VARCHAR(20) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    organization_size VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(15) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. departments
CREATE TABLE departments (
    department_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_departments_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT uq_company_department UNIQUE (company_id, department_name)
);

-- 4. locations
CREATE TABLE locations (
    location_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    location_name VARCHAR(120) NOT NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    postal_code VARCHAR(15) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_locations_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT uq_location_company_name UNIQUE (company_id, location_name)
);

-- 5. users
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NULL,
    department_id BIGINT NULL,
    role_id BIGINT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- 6. vendors
CREATE TABLE vendors (
    vendor_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    vendor_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(120) NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendors_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- 7. asset_categories
CREATE TABLE asset_categories (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_categories_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT uq_company_category UNIQUE (company_id, category_name)
);

-- 8. purchase_orders
CREATE TABLE purchase_orders (
    purchase_order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    order_number VARCHAR(80) NOT NULL UNIQUE,
    order_date DATE NOT NULL,
    expected_delivery_date DATE NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    remarks TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_orders_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_orders_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);

-- 9. assets
CREATE TABLE assets (
    asset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    vendor_id BIGINT NOT NULL,
    location_id BIGINT NULL,
    purchase_order_id BIGINT NULL,
    asset_name VARCHAR(100) NOT NULL,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    manufacturer VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    purchase_date DATE NULL,
    purchase_cost DECIMAL(12,2) NULL,
    warranty_expiry DATE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED, UNDER_REPAIR, RETIRED
    remarks TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assets_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_assets_category FOREIGN KEY (category_id) REFERENCES asset_categories(category_id),
    CONSTRAINT fk_assets_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    CONSTRAINT fk_assets_location FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    CONSTRAINT fk_assets_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id) ON DELETE SET NULL
);

-- 10. asset_requests
CREATE TABLE asset_requests (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    category_id BIGINT NULL,
    asset_id BIGINT NULL,
    approved_by BIGINT NULL,
    request_type VARCHAR(30) NOT NULL DEFAULT 'NEW_ASSET', -- NEW_ASSET, RETURN, REPLACEMENT
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    is_active BOOLEAN DEFAULT TRUE,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_requests_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_requests_employee FOREIGN KEY (employee_id) REFERENCES users(user_id),
    CONSTRAINT fk_asset_requests_category FOREIGN KEY (category_id) REFERENCES asset_categories(category_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_requests_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_requests_approver FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 11. asset_allocations
CREATE TABLE asset_allocations (
    allocation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    allocated_by BIGINT NOT NULL,
    allocated_date DATE NOT NULL,
    expected_return_date DATE NULL,
    returned_date DATE NULL,
    allocation_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RETURNED, TRANSFERRED, CANCELLED
    remarks TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_allocations_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_allocations_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_asset_allocations_employee FOREIGN KEY (employee_id) REFERENCES users(user_id),
    CONSTRAINT fk_asset_allocations_allocator FOREIGN KEY (allocated_by) REFERENCES users(user_id)
);

-- 12. asset_transfers
CREATE TABLE asset_transfers (
    transfer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    from_employee_id BIGINT NULL,
    to_employee_id BIGINT NULL,
    from_location_id BIGINT NULL,
    to_location_id BIGINT NULL,
    requested_by BIGINT NULL,
    approved_by BIGINT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    reason TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_transfers_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_transfers_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_asset_transfers_from_emp FOREIGN KEY (from_employee_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_transfers_to_emp FOREIGN KEY (to_employee_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_transfers_from_loc FOREIGN KEY (from_location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_transfers_to_loc FOREIGN KEY (to_location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_transfers_req_by FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_transfers_app_by FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 13. asset_returns
CREATE TABLE asset_returns (
    return_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    requested_by BIGINT NULL,
    approved_by BIGINT NULL,
    condition_status VARCHAR(50) NULL,
    remarks TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
    returned_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_returns_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_asset_returns_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_asset_returns_employee FOREIGN KEY (employee_id) REFERENCES users(user_id),
    CONSTRAINT fk_asset_returns_req_by FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_returns_app_by FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 14. maintenance
CREATE TABLE maintenance (
    maintenance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    issue_description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, COMPLETED, CANCELLED
    resolved_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_maintenance_employee FOREIGN KEY (employee_id) REFERENCES users(user_id)
);

-- 15. repair_history
CREATE TABLE repair_history (
    repair_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    technician_id BIGINT NULL,
    issue_description TEXT NOT NULL,
    repair_action TEXT NULL,
    cost DECIMAL(12,2) NULL DEFAULT 0.00,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, COMPLETED, CANCELLED
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_repair_history_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_repair_history_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id),
    CONSTRAINT fk_repair_history_technician FOREIGN KEY (technician_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 16. notifications
CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 17. password_reset_tokens
CREATE TABLE password_reset_tokens (
    token_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 18. audit_logs
CREATE TABLE audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    module VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_id VARCHAR(100) NULL,
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 19. ai_chat_history
CREATE TABLE ai_chat_history (
    chat_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT NULL,
    user_id BIGINT NOT NULL,
    question TEXT NULL,
    answer TEXT NULL,
    message TEXT NULL,
    sender_type VARCHAR(20) NULL DEFAULT 'USER', -- USER, AI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_chat_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_chat_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);