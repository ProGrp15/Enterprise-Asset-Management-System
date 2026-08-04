-- AssetFlow local environment reset.
-- Keeps schema, roles, permissions, platform company, and superadmin only.
USE assetflow_db;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM password_reset_tokens;
DELETE FROM notifications;
DELETE FROM audit_logs;
DELETE FROM asset_returns;
DELETE FROM asset_transfers;
DELETE FROM asset_disposals;
DELETE FROM asset_requests;
DELETE FROM asset_allocations;
DELETE FROM repair_history;
DELETE FROM service_tickets;
DELETE FROM invoices;
DELETE FROM purchase_orders;
DELETE FROM assets;
DELETE FROM asset_categories;
DELETE FROM vendors;
DELETE FROM rooms;
DELETE FROM floors;
DELETE FROM buildings;
DELETE FROM locations;
DELETE FROM departments;

DELETE FROM users WHERE email <> 'superadmin@assetflow.in';
DELETE FROM companies WHERE company_id <> (SELECT company_id FROM (SELECT company_id FROM companies WHERE company_email = 'superadmin@assetflow.in') AS platform_company);

SET FOREIGN_KEY_CHECKS = 1;

UPDATE users
SET company_id = (SELECT company_id FROM companies WHERE company_email = 'superadmin@assetflow.in')
WHERE email = 'superadmin@assetflow.in';
