-- AssetFlow Database Version 1.0 - Sample Data Population (Indian Context - Updated)
-- Auto-generated script for assetflow_db

USE assetflow_db;

-- Insert Roles
INSERT INTO roles (role_name, description) VALUES
('SUPER_ADMIN', 'Platform owner who manages multiple companies'),
('COMPANY_ADMIN', 'Administrator for a specific company'),
('EMPLOYEE', 'Standard user who requests and uses assets');

-- Insert Companies
INSERT INTO companies (company_name, company_email, company_phone, industry, organization_size, address, city, state, country, postal_code) VALUES
('TechNova Solutions', 'admin@technova.com', '9876543210', 'IT Services', '100-500', 'Phase 1, Hinjewadi Rajiv Gandhi Infotech Park', 'Pune', 'Maharashtra', 'India', '411057'),
('Global Logistics', 'contact@globallogistics.com', '9123456780', 'Logistics', '50-100', 'Andheri East, MIDC', 'Mumbai', 'Maharashtra', 'India', '400093');

-- Insert Departments (Standardized across companies as requested)
INSERT INTO departments (company_id, department_name, description) VALUES
(1, 'Engineering', 'Software Development and Testing'),
(1, 'Human Resources', 'HR and Talent Acquisition'),
(1, 'IT Support', 'Internal IT and Infrastructure'),
(2, 'Engineering', 'Software Development and Testing'),
(2, 'Human Resources', 'HR and Talent Acquisition'),
(2, 'IT Support', 'Internal IT and Infrastructure');

-- Insert Users (Passwords should be hashed in reality, using dummy strings here)
-- Super Admin (company_id = NULL, department_id = NULL)
INSERT INTO users (company_id, department_id, role_id, first_name, last_name, email, password, phone) VALUES
(NULL, NULL, 1, 'System', 'Admin', 'superadmin@assetflow.in', 'hashed_pw_1', '9999999999');

-- Company 1 Admins & Employees
-- Company Admin (department_id = NULL)
INSERT INTO users (company_id, department_id, role_id, first_name, last_name, email, password, phone) VALUES
(1, NULL, 2, 'Aditi', 'Sharma', 'aditi.sharma@technova.com', 'hashed_pw_2', '9876511111');
-- Employees (department_id required)
INSERT INTO users (company_id, department_id, role_id, first_name, last_name, email, password, phone) VALUES
(1, 1, 3, 'Rahul', 'Verma', 'rahul.verma@technova.com', 'hashed_pw_3', '9876522222'),
(1, 2, 3, 'Priya', 'Patel', 'priya.patel@technova.com', 'hashed_pw_4', '9876533333');

-- Company 2 Admins & Employees
-- Company Admin (department_id = NULL)
INSERT INTO users (company_id, department_id, role_id, first_name, last_name, email, password, phone) VALUES
(2, NULL, 2, 'Vikram', 'Singh', 'vikram.singh@globallogistics.com', 'hashed_pw_5', '9123411111');
-- Employees (department_id required)
INSERT INTO users (company_id, department_id, role_id, first_name, last_name, email, password, phone) VALUES
(2, 4, 3, 'Neha', 'Gupta', 'neha.gupta@globallogistics.com', 'hashed_pw_6', '9123422222'),
(2, 6, 3, 'Rohan', 'Deshmukh', 'rohan.deshmukh@globallogistics.com', 'hashed_pw_7', '9123433333');

-- Insert Vendors
INSERT INTO vendors (company_id, vendor_name, contact_person, email, phone, address) VALUES
(1, 'Dell India Pvt Ltd', 'Rajesh Kumar', 'sales.india@dell.com', '1800-425-4026', 'Koramangala, Bengaluru'),
(1, 'Apple India', 'Sanjay Joshi', 'business.in@apple.com', '1800-425-4646', 'UB City, Bengaluru'),
(2, 'Lenovo India', 'Amit Desai', 'contact.in@lenovo.com', '1800-419-7555', 'Bandra Kurla Complex, Mumbai');

-- Insert Asset Categories
INSERT INTO asset_categories (company_id, category_name, description) VALUES
(1, 'Laptops', 'Company issued laptops'),
(1, 'Monitors', 'External display monitors'),
(1, 'Mobile Phones', 'Corporate mobile devices'),
(2, 'Laptops', 'Field agent laptops'),
(2, 'Tablets', 'Warehouse tracking tablets');

-- Insert Assets
INSERT INTO assets (company_id, category_id, vendor_id, asset_name, asset_tag, serial_number, manufacturer, model, purchase_date, purchase_cost, warranty_expiry, status, remarks) VALUES
(1, 1, 1, 'Dell XPS 15', 'TN-LAP-001', 'SN-DELL-12345', 'Dell', 'XPS 15 9500', '2023-01-15', 125000.00, '2026-01-15', 'ALLOCATED', 'High performance laptop for engineering'),
(1, 1, 2, 'MacBook Pro 16', 'TN-LAP-002', 'SN-APP-98765', 'Apple', 'MacBook Pro M2', '2023-06-10', 215000.00, '2026-06-10', 'AVAILABLE', 'Design and iOS dev laptop'),
(1, 2, 1, 'Dell UltraSharp 27', 'TN-MON-001', 'SN-DELL-MON-111', 'Dell', 'U2720Q', '2023-02-20', 45000.00, '2026-02-20', 'ALLOCATED', '4K Monitor'),
(2, 5, 3, 'Lenovo Tab P11', 'GL-TAB-001', 'SN-LEN-TAB-001', 'Lenovo', 'Tab P11 Pro', '2024-01-05', 28000.00, '2025-01-05', 'UNDER_REPAIR', 'Used in Bhiwandi warehouse');

-- Insert Asset Allocations (Allocating TN-LAP-001 to Rahul)
INSERT INTO asset_allocations (company_id, asset_id, employee_id, allocated_by, allocated_date, allocation_status, remarks) VALUES
(1, 1, 3, 2, '2023-02-01', 'ACTIVE', 'Initial allocation for Rahul');

-- Insert Asset Requests
INSERT INTO asset_requests (company_id, employee_id, category_id, asset_id, approved_by, request_type, reason, status) VALUES
(1, 4, 1, NULL, NULL, 'NEW_ASSET', 'Need a laptop for HR onboarding tasks', 'PENDING'),
(2, 6, NULL, 4, 5, 'REPLACEMENT', 'Tablet screen is cracked, need a replacement', 'APPROVED');

-- Insert Service Tickets
INSERT INTO service_tickets (company_id, asset_id, employee_id, issue_description, priority, status) VALUES
(2, 4, 6, 'Screen cracked during inventory check', 'HIGH', 'IN_PROGRESS');

-- Insert Notifications
INSERT INTO notifications (company_id, user_id, title, message) VALUES
(1, 4, 'Asset Request Submitted', 'Your request for a new laptop has been submitted and is pending approval.'),
(2, 6, 'Ticket Updated', 'Your service ticket for Lenovo Tab P11 has been moved to IN_PROGRESS.');

-- Insert Audit Logs
INSERT INTO audit_logs (company_id, user_id, module, action, entity_id, description, ip_address) VALUES
(1, 2, 'Assets', 'CREATE_ASSET', 1, 'Added Dell XPS 15 to inventory', '192.168.1.100'),
(2, 5, 'Service_Tickets', 'UPDATE_TICKET', 1, 'Changed ticket status to IN_PROGRESS', '192.168.1.101');