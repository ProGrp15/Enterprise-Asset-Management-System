package com.assetflow.company;

import com.assetflow.company.service.CompanyDataService;
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
class CompanyWorkflowIntegrationTest {

    @Autowired
    private CompanyDataService service;

    @Autowired
    private JdbcTemplate jdbc;

    private Long testCompanyId;
    private Long testAdminId;

    @BeforeEach
    void setUp() {
        // Ensure test company exists
        List<Map<String, Object>> companies = jdbc.queryForList("SELECT company_id FROM companies LIMIT 1");
        if (companies.isEmpty()) {
            jdbc.update("INSERT INTO companies(company_name, email, phone, is_active) VALUES (?, ?, ?, ?)",
                    "Test Corp", "test@testcorp.com", "1234567890", true);
            testCompanyId = jdbc.queryForObject("SELECT company_id FROM companies WHERE email = 'test@testcorp.com'", Long.class);
        } else {
            testCompanyId = ((Number) companies.get(0).get("company_id")).longValue();
        }

        List<Map<String, Object>> users = jdbc.queryForList("SELECT user_id FROM users WHERE company_id = ? LIMIT 1", testCompanyId);
        if (users.isEmpty()) {
            testAdminId = 1L;
        } else {
            testAdminId = ((Number) users.get(0).get("user_id")).longValue();
        }
    }

    @Test
    @DisplayName("Phase 4: Department Management Workflow")
    void testDepartmentManagement() {
        // 1. Create Department
        Map<String, Object> deptPayload = new HashMap<>();
        deptPayload.put("departmentName", "Engineering Test " + UUID.randomUUID().toString().substring(0, 5));
        deptPayload.put("description", "Software Engineering Department");

        Map<String, Object> created = service.create("department", testCompanyId, testAdminId, deptPayload);
        assertNotNull(created);
        Long deptId = ((Number) (created.get("department_id") != null ? created.get("department_id") : created.get("id"))).longValue();
        assertTrue(deptId > 0);

        // 2. List Departments
        List<Map<String, Object>> depts = service.list("department", testCompanyId, testAdminId, "COMPANY_ADMIN", null, 0, 50);
        assertFalse(depts.isEmpty());
        assertTrue(depts.stream().anyMatch(d -> deptId.equals(((Number) (d.get("department_id") != null ? d.get("department_id") : d.get("id"))).longValue())));

        // 3. Get One Department
        Map<String, Object> one = service.one("department", testCompanyId, testAdminId, "COMPANY_ADMIN", deptId);
        assertNotNull(one);
        assertEquals(deptPayload.get("departmentName"), one.get("department_name"));

        // 4. Update Department
        String updatedDeptName = "Updated Engineering " + UUID.randomUUID().toString().substring(0, 5);
        Map<String, Object> updatePayload = new HashMap<>();
        updatePayload.put("departmentName", updatedDeptName);
        updatePayload.put("description", "Updated description");
        Map<String, Object> updated = service.update("department", testCompanyId, testAdminId, deptId, updatePayload);
        assertNotNull(updated);
        assertEquals(updatedDeptName, updated.get("department_name"));
    }

    @Test
    @DisplayName("Phase 5: Employee Management Workflow")
    void testEmployeeManagement() {
        // Find or create a department
        List<Map<String, Object>> depts = service.list("department", testCompanyId, testAdminId, "COMPANY_ADMIN", null, 0, 10);
        Long deptId = null;
        if (!depts.isEmpty()) {
            deptId = ((Number) (depts.get(0).get("department_id") != null ? depts.get(0).get("department_id") : depts.get(0).get("id"))).longValue();
        }

        String uniqueEmail = "employee." + UUID.randomUUID().toString().substring(0, 6) + "@testcorp.com";
        Map<String, Object> empPayload = new HashMap<>();
        empPayload.put("firstName", "John");
        empPayload.put("lastName", "Doe");
        empPayload.put("email", uniqueEmail);
        empPayload.put("phone", "9876543210");
        empPayload.put("password", "SecurePassword123!");
        empPayload.put("departmentId", deptId);
        empPayload.put("role", "EMPLOYEE");

        // 1. Create Employee
        Map<String, Object> created = service.create("employee", testCompanyId, testAdminId, empPayload);
        assertNotNull(created);
        Long empId = ((Number) (created.get("user_id") != null ? created.get("user_id") : created.get("id"))).longValue();
        assertTrue(empId > 0);

        // 2. Verify Employee list has joined department_name and role_name
        List<Map<String, Object>> employees = service.list("employee", testCompanyId, testAdminId, "COMPANY_ADMIN", null, 0, 50);
        Optional<Map<String, Object>> found = employees.stream()
                .filter(e -> empId.equals(((Number) (e.get("user_id") != null ? e.get("user_id") : e.get("id"))).longValue()))
                .findFirst();
        assertTrue(found.isPresent());
        assertEquals("John", found.get().get("first_name"));
        assertEquals("Doe", found.get().get("last_name"));
        assertEquals(uniqueEmail, found.get().get("email"));
        assertNotNull(found.get().get("role_name"));

        // 3. Update Employee
        Map<String, Object> updatePayload = new HashMap<>();
        updatePayload.put("firstName", "Johnny");
        updatePayload.put("lastName", "Doe Updated");
        updatePayload.put("phone", "9998887776");
        Map<String, Object> updated = service.update("employee", testCompanyId, testAdminId, empId, updatePayload);
        assertNotNull(updated);
        assertEquals("Johnny", updated.get("first_name"));
    }

    @Test
    @DisplayName("Phase 8: Location Management Workflow")
    void testLocationManagement() {
        Map<String, Object> locPayload = new HashMap<>();
        locPayload.put("locationName", "Pune HQ " + UUID.randomUUID().toString().substring(0, 4));
        locPayload.put("address", "Hinjewadi Phase 1");
        locPayload.put("city", "Pune");
        locPayload.put("state", "Maharashtra");
        locPayload.put("country", "India");

        Map<String, Object> created = service.create("location", testCompanyId, testAdminId, locPayload);
        assertNotNull(created);
        Long locId = ((Number) (created.get("location_id") != null ? created.get("location_id") : created.get("id"))).longValue();
        assertTrue(locId > 0);

        List<Map<String, Object>> locations = service.list("location", testCompanyId, testAdminId, "COMPANY_ADMIN", null, 0, 20);
        assertTrue(locations.stream().anyMatch(l -> locId.equals(((Number) (l.get("location_id") != null ? l.get("location_id") : l.get("id"))).longValue())));
    }
}
