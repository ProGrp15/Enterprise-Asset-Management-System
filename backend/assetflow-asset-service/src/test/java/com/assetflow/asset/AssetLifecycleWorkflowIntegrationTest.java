package com.assetflow.asset;

import com.assetflow.asset.service.AssetDataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "eureka.client.enabled=false",
    "eureka.client.register-with-eureka=false",
    "eureka.client.fetch-registry=false"
})
class AssetLifecycleWorkflowIntegrationTest {

    @Autowired
    private AssetDataService service;

    @Autowired
    private JdbcTemplate jdbc;

    private Long testCompanyId;
    private Long testAdminId;
    private Long testEmployeeId;
    private Long testLocationId;

    @BeforeEach
    void setUp() {
        // Ensure test company exists
        List<Map<String, Object>> companies = jdbc.queryForList("SELECT company_id FROM companies LIMIT 1");
        if (companies.isEmpty()) {
            jdbc.update("INSERT INTO companies(company_name, email, phone, is_active) VALUES (?, ?, ?, ?)",
                    "Asset Test Corp", "assets@testcorp.com", "1234567890", true);
            testCompanyId = jdbc.queryForObject("SELECT company_id FROM companies WHERE email = 'assets@testcorp.com'", Long.class);
        } else {
            testCompanyId = ((Number) companies.get(0).get("company_id")).longValue();
        }

        // Ensure test admin exists
        List<Map<String, Object>> admins = jdbc.queryForList("SELECT user_id FROM users WHERE company_id = ? AND role_id = 2 LIMIT 1", testCompanyId);
        if (admins.isEmpty()) {
            jdbc.update("INSERT INTO users(company_id, role_id, first_name, last_name, email, password, phone, is_active) VALUES (?, 2, 'Admin', 'User', 'admin.asset@testcorp.com', 'hash', '1234567890', 1)", testCompanyId);
            testAdminId = jdbc.queryForObject("SELECT user_id FROM users WHERE email = 'admin.asset@testcorp.com'", Long.class);
        } else {
            testAdminId = ((Number) admins.get(0).get("user_id")).longValue();
        }

        // Ensure test employee exists
        List<Map<String, Object>> emps = jdbc.queryForList("SELECT user_id FROM users WHERE company_id = ? AND role_id = 3 LIMIT 1", testCompanyId);
        if (emps.isEmpty()) {
            jdbc.update("INSERT INTO users(company_id, role_id, first_name, last_name, email, password, phone, is_active) VALUES (?, 3, 'Employee', 'One', 'emp1@testcorp.com', 'hash', '1234567890', 1)", testCompanyId);
            testEmployeeId = jdbc.queryForObject("SELECT user_id FROM users WHERE email = 'emp1@testcorp.com'", Long.class);
        } else {
            testEmployeeId = ((Number) emps.get(0).get("user_id")).longValue();
        }

        // Ensure test location exists
        List<Map<String, Object>> locs = jdbc.queryForList("SELECT location_id FROM locations WHERE company_id = ? LIMIT 1", testCompanyId);
        if (locs.isEmpty()) {
            jdbc.update("INSERT INTO locations(company_id, location_name, city, country) VALUES (?, 'Pune HQ', 'Pune', 'India')", testCompanyId);
            testLocationId = jdbc.queryForObject("SELECT location_id FROM locations WHERE company_id = ? LIMIT 1", Long.class, testCompanyId);
        } else {
            testLocationId = ((Number) locs.get(0).get("location_id")).longValue();
        }
    }

    @Test
    @DisplayName("Complete End-to-End Asset Lifecycle Workflow (Phases 6-18)")
    void testCompleteAssetLifecycle() {
        // --- PHASE 6: Vendor Management ---
        Map<String, Object> vendorPayload = new HashMap<>();
        vendorPayload.put("vendorName", "Dell Technologies " + UUID.randomUUID().toString().substring(0, 4));
        vendorPayload.put("contactPerson", "Michael Dell");
        vendorPayload.put("email", "dell.sales@dell.com");
        vendorPayload.put("phone", "1800-425-0045");
        Map<String, Object> vendor = service.create("vendor", testCompanyId, testAdminId, vendorPayload);
        assertNotNull(vendor);
        Long vendorId = ((Number) (vendor.get("vendor_id") != null ? vendor.get("vendor_id") : vendor.get("id"))).longValue();
        assertTrue(vendorId > 0);

        // --- PHASE 7: Asset Category Management ---
        Map<String, Object> catPayload = new HashMap<>();
        catPayload.put("categoryName", "Laptop " + UUID.randomUUID().toString().substring(0, 4));
        catPayload.put("description", "High-performance enterprise laptops");
        Map<String, Object> category = service.create("category", testCompanyId, testAdminId, catPayload);
        assertNotNull(category);
        Long categoryId = ((Number) (category.get("category_id") != null ? category.get("category_id") : category.get("id"))).longValue();
        assertTrue(categoryId > 0);

        // --- PHASE 9: Purchase Order Creation ---
        Map<String, Object> poPayload = new HashMap<>();
        poPayload.put("poNumber", "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        poPayload.put("vendorId", vendorId);
        poPayload.put("totalAmount", 2500.00);
        poPayload.put("status", "APPROVED");
        Map<String, Object> po = service.create("purchase-order", testCompanyId, testAdminId, poPayload);
        Long poId = ((Number) (po.get("purchase_order_id") != null ? po.get("purchase_order_id") : (po.get("po_id") != null ? po.get("po_id") : po.get("id")))).longValue();
        assertTrue(poId > 0);

        // --- PHASE 10: Asset Creation with Relational Joins ---
        String tag = "TAG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String serial = "SN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Map<String, Object> assetPayload = new HashMap<>();
        assetPayload.put("assetName", "Dell Latitude 7440 Enterprise");
        assetPayload.put("assetTag", tag);
        assetPayload.put("serialNumber", serial);
        assetPayload.put("categoryId", categoryId);
        assetPayload.put("vendorId", vendorId);
        assetPayload.put("locationId", testLocationId);
        assetPayload.put("poId", poId);
        assetPayload.put("purchaseCost", 1250.00);
        assetPayload.put("status", "AVAILABLE");

        Map<String, Object> createdAsset = service.create("asset", testCompanyId, testAdminId, assetPayload);
        assertNotNull(createdAsset);
        Long assetId = ((Number) (createdAsset.get("asset_id") != null ? createdAsset.get("asset_id") : createdAsset.get("id"))).longValue();
        assertTrue(assetId > 0);

        // Verify that listing assets returns joined human-readable names
        List<Map<String, Object>> assetsList = service.list("asset", testCompanyId, testAdminId, "COMPANY_ADMIN", null, 0, 50);
        Optional<Map<String, Object>> foundAsset = assetsList.stream()
                .filter(a -> assetId.equals(((Number) (a.get("asset_id") != null ? a.get("asset_id") : a.get("id"))).longValue()))
                .findFirst();
        assertTrue(foundAsset.isPresent());
        assertNotNull(foundAsset.get().get("category_name"));
        assertNotNull(foundAsset.get().get("vendor_name"));
        assertNotNull(foundAsset.get().get("location_name"));

        // --- PHASE 11: Asset Allocation ---
        Map<String, Object> allocPayload = new HashMap<>();
        allocPayload.put("assetId", assetId);
        allocPayload.put("employeeId", testEmployeeId);
        allocPayload.put("allocatedBy", testAdminId);
        allocPayload.put("notes", "Allocated for development work");
        Map<String, Object> alloc = service.create("asset-allocation", testCompanyId, testAdminId, allocPayload);
        assertNotNull(alloc);

        // Asset status should now be updated to ASSIGNED
        Map<String, Object> assetAfterAlloc = service.one("asset", testCompanyId, testAdminId, "COMPANY_ADMIN", assetId);
        assertTrue(Set.of("ASSIGNED", "ALLOCATED").contains(String.valueOf(assetAfterAlloc.get("status")).toUpperCase()));

        // --- PHASE 12: Employee Asset Visibility ---
        List<Map<String, Object>> empAssets = service.list("asset", testCompanyId, testEmployeeId, "EMPLOYEE", null, 0, 50);
        assertTrue(empAssets.stream().anyMatch(a -> assetId.equals(((Number) (a.get("asset_id") != null ? a.get("asset_id") : a.get("id"))).longValue())));

        // --- PHASE 13: Asset Request by Employee ---
        Map<String, Object> reqPayload = new HashMap<>();
        reqPayload.put("employeeId", testEmployeeId);
        reqPayload.put("categoryId", categoryId);
        reqPayload.put("requestType", "NEW_ASSET");
        reqPayload.put("reason", "Need secondary device for testing");
        reqPayload.put("priority", "HIGH");
        reqPayload.put("status", "PENDING");
        Map<String, Object> req = service.create("asset-request", testCompanyId, testEmployeeId, reqPayload);
        assertNotNull(req);
        Long reqId = ((Number) (req.get("request_id") != null ? req.get("request_id") : req.get("id"))).longValue();
        assertTrue(reqId > 0);

        // --- PHASE 14: Company Admin Reviews & Approves Request ---
        Map<String, Object> approvePayload = new HashMap<>();
        approvePayload.put("status", "APPROVED");
        approvePayload.put("approvedBy", testAdminId);
        approvePayload.put("comments", "Approved as requested");
        Map<String, Object> approvedReq = service.update("asset-request", testCompanyId, testAdminId, reqId, approvePayload);
        assertNotNull(approvedReq);
        assertEquals("APPROVED", String.valueOf(approvedReq.get("status")).toUpperCase());

        // --- PHASE 15: Maintenance Workflow ---
        Map<String, Object> maintPayload = new HashMap<>();
        maintPayload.put("assetId", assetId);
        maintPayload.put("reportedBy", testEmployeeId);
        maintPayload.put("issueDescription", "Laptop Battery drain issue");
        maintPayload.put("priority", "HIGH");
        maintPayload.put("status", "OPEN");
        Map<String, Object> maint = service.create("maintenance", testCompanyId, testEmployeeId, maintPayload);
        assertNotNull(maint);
        Long maintId = ((Number) (maint.get("maintenance_id") != null ? maint.get("maintenance_id") : maint.get("id"))).longValue();
        assertTrue(maintId > 0);

        // Update maintenance status to COMPLETED
        Map<String, Object> maintUpdate = new HashMap<>();
        maintUpdate.put("status", "COMPLETED");
        maintUpdate.put("vendorId", vendorId);
        maintUpdate.put("cost", 120.00);
        maintUpdate.put("resolutionNotes", "Battery replaced under vendor support");
        Map<String, Object> completedMaint = service.update("maintenance", testCompanyId, testAdminId, maintId, maintUpdate);
        assertNotNull(completedMaint);
        assertEquals("COMPLETED", String.valueOf(completedMaint.get("status")).toUpperCase());

        // --- PHASE 16: Repair History Recording ---
        Map<String, Object> repairPayload = new HashMap<>();
        repairPayload.put("assetId", assetId);
        repairPayload.put("maintenanceId", maintId);
        repairPayload.put("repairType", "Battery Replacement");
        repairPayload.put("description", "Replaced with OEM Dell 6-cell battery");
        repairPayload.put("repairCost", 120.00);
        repairPayload.put("performedBy", "Dell Certified Tech");
        repairPayload.put("status", "COMPLETED");
        Map<String, Object> repair = service.create("repair-history", testCompanyId, testAdminId, repairPayload);
        assertNotNull(repair);

        // --- PHASE 17: Asset Transfer ---
        // Create second employee
        jdbc.update("INSERT INTO users(company_id, role_id, first_name, last_name, email, password, phone, is_active) VALUES (?, 3, 'Second', 'Employee', ?, 'hash', '1234567890', 1)",
                testCompanyId, "emp2." + UUID.randomUUID().toString().substring(0, 5) + "@testcorp.com");
        Long secondEmpId = jdbc.queryForObject("SELECT user_id FROM users WHERE company_id = ? AND role_id = 3 ORDER BY user_id DESC LIMIT 1", Long.class, testCompanyId);

        Map<String, Object> transferPayload = new HashMap<>();
        transferPayload.put("assetId", assetId);
        transferPayload.put("fromEmployeeId", testEmployeeId);
        transferPayload.put("toEmployeeId", secondEmpId);
        transferPayload.put("reason", "Role change to frontend team");
        transferPayload.put("status", "APPROVED");
        transferPayload.put("approvedBy", testAdminId);
        Map<String, Object> transfer = service.create("asset-transfer", testCompanyId, testAdminId, transferPayload);
        assertNotNull(transfer);

        // --- PHASE 18: Asset Return ---
        Map<String, Object> returnPayload = new HashMap<>();
        returnPayload.put("assetId", assetId);
        returnPayload.put("employeeId", secondEmpId);
        returnPayload.put("returnReason", "Project completion");
        returnPayload.put("conditionStatus", "GOOD");
        returnPayload.put("status", "APPROVED");
        returnPayload.put("approvedBy", testAdminId);
        Map<String, Object> ret = service.create("asset-return", testCompanyId, testAdminId, returnPayload);
        assertNotNull(ret);

        // Asset status should now be updated to AVAILABLE
        Map<String, Object> assetAfterReturn = service.one("asset", testCompanyId, testAdminId, "COMPANY_ADMIN", assetId);
        assertEquals("AVAILABLE", String.valueOf(assetAfterReturn.get("status")).toUpperCase());
    }
}
