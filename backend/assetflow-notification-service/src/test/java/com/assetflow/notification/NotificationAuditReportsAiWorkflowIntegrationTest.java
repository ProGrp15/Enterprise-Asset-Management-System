package com.assetflow.notification;

import com.assetflow.notification.service.NotificationDataService;
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
class NotificationAuditReportsAiWorkflowIntegrationTest {

    @Autowired
    private NotificationDataService service;

    @Autowired
    private JdbcTemplate jdbc;

    private Long testCompanyId;
    private Long testUserId;
    private Map<String, Object> claims;

    @BeforeEach
    void setUp() {
        // Ensure test company exists
        List<Map<String, Object>> companies = jdbc.queryForList("SELECT company_id FROM companies LIMIT 1");
        if (companies.isEmpty()) {
            jdbc.update("INSERT INTO companies(company_name, email, phone, is_active) VALUES (?, ?, ?, ?)",
                    "Notification Corp", "notif@testcorp.com", "1234567890", true);
            testCompanyId = jdbc.queryForObject("SELECT company_id FROM companies WHERE email = 'notif@testcorp.com'", Long.class);
        } else {
            testCompanyId = ((Number) companies.get(0).get("company_id")).longValue();
        }

        List<Map<String, Object>> users = jdbc.queryForList("SELECT user_id FROM users WHERE company_id = ? LIMIT 1", testCompanyId);
        if (users.isEmpty()) {
            jdbc.update("INSERT INTO users(company_id, role_id, first_name, last_name, email, password, phone, is_active) VALUES (?, 2, 'Admin', 'Notif', 'admin.notif@testcorp.com', 'hash', '1234567890', 1)", testCompanyId);
            testUserId = jdbc.queryForObject("SELECT user_id FROM users WHERE email = 'admin.notif@testcorp.com'", Long.class);
        } else {
            testUserId = ((Number) users.get(0).get("user_id")).longValue();
        }

        claims = new HashMap<>();
        claims.put("sub", String.valueOf(testUserId));
        claims.put("companyId", testCompanyId);
        claims.put("role", "COMPANY_ADMIN");
    }

    @Test
    @DisplayName("Phase 19: Notifications Lifecycle Workflow")
    void testNotificationsWorkflow() {
        // 1. Create Notification
        Map<String, Object> notifPayload = new HashMap<>();
        notifPayload.put("userId", testUserId);
        notifPayload.put("title", "Asset Assigned");
        notifPayload.put("message", "A new Dell Latitude has been assigned to you.");
        notifPayload.put("type", "ASSET_ASSIGNED");

        Map<String, Object> created = service.createNotification(claims, notifPayload);
        assertNotNull(created);
        Long notifId = ((Number) (created.get("notification_id") != null ? created.get("notification_id") : created.get("id"))).longValue();
        assertTrue(notifId > 0);

        // 2. List Notifications
        List<Map<String, Object>> notifs = service.notifications(claims);
        assertFalse(notifs.isEmpty());
        assertTrue(notifs.stream().anyMatch(n -> notifId.equals(((Number) (n.get("notification_id") != null ? n.get("notification_id") : n.get("id"))).longValue())));

        // 3. Mark Notification Read
        service.read(claims, notifId);
        List<Map<String, Object>> notifsAfterRead = service.notifications(claims);
        Optional<Map<String, Object>> readNotif = notifsAfterRead.stream()
                .filter(n -> notifId.equals(((Number) (n.get("notification_id") != null ? n.get("notification_id") : n.get("id"))).longValue()))
                .findFirst();
        assertTrue(readNotif.isPresent());
        assertEquals(true, Boolean.valueOf(String.valueOf(readNotif.get().get("is_read"))));

        // 4. Mark All Read
        service.readAll(claims);
    }

    @Test
    @DisplayName("Phase 20: Audit Logs Tracking Workflow")
    void testAuditLogsWorkflow() {
        // 1. Create Audit Log
        Map<String, Object> auditPayload = new HashMap<>();
        auditPayload.put("action", "CREATE");
        auditPayload.put("entityName", "ASSET");
        auditPayload.put("entityId", 101L);
        auditPayload.put("details", "Asset TAG-001 created by Admin");

        Map<String, Object> created = service.audit(claims, auditPayload);
        assertNotNull(created);

        // 2. Query Audit Logs with Joined User Information
        List<Map<String, Object>> audits = service.audits(claims);
        assertFalse(audits.isEmpty());
        Map<String, Object> latestAudit = audits.get(0);
        assertNotNull(latestAudit.get("action"));
        assertNotNull(latestAudit.get("entity_name"));
    }

    @Test
    @DisplayName("Phase 21: Reports and Dashboard Summary Metrics")
    void testDashboardAndReports() {
        // 1. Dashboard Metrics
        Map<String, Object> dashboard = service.dashboard(claims);
        assertNotNull(dashboard);
        assertTrue(dashboard.containsKey("totalAssets") || dashboard.containsKey("total_assets") || dashboard.containsKey("assetsCount"));

        // 2. Reports
        List<Map<String, Object>> assetReport = service.report("assets", claims);
        assertNotNull(assetReport);

        List<Map<String, Object>> deptReport = service.report("departments", claims);
        assertNotNull(deptReport);

        List<Map<String, Object>> maintReport = service.report("maintenance", claims);
        assertNotNull(maintReport);

        List<Map<String, Object>> reqReport = service.report("requests", claims);
        assertNotNull(reqReport);
    }

    @Test
    @DisplayName("Phase 22: AI Assistant Grounded Queries and History Logging")
    void testAiAssistantWorkflow() {
        Map<String, Object> chatPayload = new HashMap<>();
        chatPayload.put("prompt", "Show all available assets and company summary");

        Map<String, Object> response = service.chat(chatPayload, claims);
        assertNotNull(response);
        assertTrue(response.containsKey("reply") || response.containsKey("response") || response.containsKey("answer"));

        // Verify that chat was persisted into ai_chat_history table
        List<Map<String, Object>> history = jdbc.queryForList(
                "SELECT * FROM ai_chat_history WHERE company_id = ? ORDER BY chat_id DESC LIMIT 5", testCompanyId);
        assertFalse(history.isEmpty());
        assertTrue(history.stream().anyMatch(h -> (String.valueOf(h.get("question")) + String.valueOf(h.get("message"))).contains("available assets")));
    }
}
