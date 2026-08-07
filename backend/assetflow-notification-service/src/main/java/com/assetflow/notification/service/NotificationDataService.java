package com.assetflow.notification.service;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class NotificationDataService {
  private final JdbcTemplate db;
  private final String geminiKey;
  private final String geminiModel;

  public NotificationDataService(JdbcTemplate d,
                                 @Value("${app.gemini.api-key:}") String k,
                                 @Value("${app.gemini.model:gemini-2.0-flash}") String m) {
    this.db = d;
    this.geminiKey = k;
    this.geminiModel = m;
  }

  private long number(Object value) {
    if (value instanceof Number n) return n.longValue();
    return Long.parseLong(String.valueOf(value));
  }

  private long company(Map<String,Object> c) {
    return number(c.get("companyId"));
  }

  private long user(Map<String,Object> c) {
    return number(c.get("sub"));
  }

  public List<Map<String,Object>> notifications(Map<String,Object> c) {
    return db.queryForList("select * from notifications where company_id=? and (user_id=? or user_id=0) order by created_at desc", company(c), user(c));
  }

  @Transactional
  public Map<String,Object> createNotification(Map<String,Object> c, Map<String,Object> b) {
    long userId = b.get("userId") != null ? number(b.get("userId")) : (b.get("user_id") != null ? number(b.get("user_id")) : user(c));
    String title = String.valueOf(b.getOrDefault("title", "Notification"));
    String message = String.valueOf(b.getOrDefault("message", ""));
    db.update("insert into notifications(company_id,user_id,title,message) values(?,?,?,?)",
        company(c), userId, title, message);
    Long notifId = db.queryForObject("select notification_id from notifications where company_id=? and user_id=? order by notification_id desc limit 1", Long.class, company(c), userId);
    Map<String, Object> res = new LinkedHashMap<>(b);
    res.put("notification_id", notifId);
    res.put("id", notifId);
    res.put("is_read", false);
    return res;
  }

  public void read(Map<String,Object> c, long id) {
    db.update("update notifications set is_read=true where notification_id=? and company_id=?", id, company(c));
  }

  public void delete(Map<String,Object> c, long id) {
    db.update("delete from notifications where notification_id=? and company_id=? and (user_id=? or user_id=0)", id, company(c), user(c));
  }

  public void readAll(Map<String,Object> c) {
    db.update("update notifications set is_read=true where company_id=? and (user_id=? or user_id=0)", company(c), user(c));
  }

  public List<Map<String,Object>> audits(Map<String,Object> c) {
    String sql = "select a.*, a.module as entity_name, concat(u.first_name, ' ', u.last_name) as user_name, u.email as user_email from audit_logs a left join users u on u.user_id=a.user_id where a.company_id=?";
    if ("EMPLOYEE".equals(String.valueOf(c.get("role")))) {
      return db.queryForList(sql + " and a.user_id=? order by a.created_at desc limit 200", company(c), user(c));
    }
    return db.queryForList(sql + " order by a.created_at desc limit 200", company(c));
  }

  @Transactional
  public Map<String,Object> audit(Map<String,Object> c, Map<String,Object> b) {
    String module = String.valueOf(b.getOrDefault("module", b.getOrDefault("moduleName", b.getOrDefault("entityName", b.getOrDefault("entity_name", "GENERAL")))));
    String action = String.valueOf(b.getOrDefault("action", "AUDIT_EVENT"));
    String entityId = b.get("entityId") != null ? String.valueOf(b.get("entityId")) : (b.get("entity_id") != null ? String.valueOf(b.get("entity_id")) : null);
    String description = b.get("description") != null ? String.valueOf(b.get("description")) : (b.get("details") != null ? String.valueOf(b.get("details")) : "Audit record");
    String ipAddress = b.get("ipAddress") != null ? String.valueOf(b.get("ipAddress")) : (b.get("ip_address") != null ? String.valueOf(b.get("ip_address")) : "127.0.0.1");
    db.update("insert into audit_logs(company_id,user_id,module,action,entity_id,description,ip_address) values(?,?,?,?,?,?,?)",
        company(c), user(c), module, action, entityId, description, ipAddress);
    Map<String, Object> res = new LinkedHashMap<>(b);
    res.put("module", module);
    res.put("entity_name", module);
    return res;
  }

  public Map<String,Object> dashboard(Map<String,Object> c) {
    Map<String,Object> d = new LinkedHashMap<>();
    long tenant = company(c);
    boolean employee = "EMPLOYEE".equals(String.valueOf(c.get("role")));
    String scope = employee ? " and user_id=?" : "";
    Object[] notificationArgs = employee ? new Object[]{tenant, user(c)} : new Object[]{tenant};
    d.put("totalAssets", safeCount("select count(*) from assets where company_id=? and is_active=true", tenant));
    d.put("total_assets", d.get("totalAssets"));
    d.put("allocatedAssets", safeCount("select count(*) from assets where company_id=? and is_active=true and status='ALLOCATED'", tenant));
    d.put("availableAssets", safeCount("select count(*) from assets where company_id=? and is_active=true and status='AVAILABLE'", tenant));
    d.put("maintenanceCount", safeCount("select count(*) from maintenance where company_id=? and is_active=true and status not in ('COMPLETED','CANCELLED')", tenant));
    d.put("notifications", db.queryForObject("select count(*) from notifications where company_id=?" + scope, Long.class, notificationArgs));
    d.put("unreadNotifications", db.queryForObject("select count(*) from notifications where company_id=? and is_read=false" + scope, Long.class, notificationArgs));
    d.put("auditEvents", db.queryForObject("select count(*) from audit_logs where company_id=?" + (employee ? " and user_id=?" : ""), Long.class, employee ? new Object[]{tenant, user(c)} : new Object[]{tenant}));
    return d;
  }

  public List<Map<String,Object>> report(String type, Map<String,Object> c) {
    String sql = switch (type) {
      case "assets" -> "select status, count(*) as total from assets where company_id=? and is_active=true group by status";
      case "users", "employees" -> "select r.role_name, count(*) as total from users u join roles r on r.role_id=u.role_id where u.company_id=? and u.is_active=true group by r.role_name";
      case "departments" -> "select d.department_name, count(u.user_id) as total from departments d left join users u on u.department_id=d.department_id and u.company_id=d.company_id and u.is_active=true where d.company_id=? and d.is_active=true group by d.department_id, d.department_name";
      case "vendors" -> "select is_active, count(*) as total from vendors where company_id=? group by is_active";
      case "maintenance" -> "select status, count(*) as total from maintenance where company_id=? and is_active=true group by status";
      case "requests" -> "select status, count(*) as total from asset_requests where company_id=? and is_active=true group by status";
      case "audit" -> "select module, count(*) as total from audit_logs where company_id=? group by module order by total desc";
      default -> "select status, count(*) as total from purchase_orders where company_id=? and is_active=true group by status";
    };
    return db.queryForList(sql, company(c));
  }

  public Map<String,Object> chat(Map<String,Object> body) {
    String prompt = String.valueOf(body.getOrDefault("message", body.getOrDefault("prompt", body.getOrDefault("query", ""))));
    if (geminiKey == null || geminiKey.isBlank()) {
      return Map.of("reply", "Gemini is not configured yet. Set GEMINI_API_KEY in the notification service environment to enable company-aware answers.", "configured", false);
    }
    Map<String,Object> payload = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
    try {
      Map<?,?> result = RestClient.create().post().uri("https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiKey).body(payload).retrieve().body(Map.class);
      String text = extractText(result);
      return Map.of("reply", text, "configured", true);
    } catch (Exception ex) {
      return Map.of("reply", "Gemini is configured but unavailable. Verify the key, model access, and network connection.", "configured", true, "providerError", true);
    }
  }

  private String extractText(Map<?,?> response) {
    try {
      Object candidates = response.get("candidates");
      if (candidates instanceof List<?> list && !list.isEmpty()) {
        Object content = ((Map<?,?>) list.get(0)).get("content");
        Object parts = ((Map<?,?>) content).get("parts");
        if (parts instanceof List<?> p && !p.isEmpty()) {
          return String.valueOf(((Map<?,?>) p.get(0)).get("text"));
        }
      }
    } catch (Exception ignored) {}
    return "Gemini returned no readable text.";
  }

  public Map<String,Object> chat(Map<String,Object> body, Map<String,Object> claims) {
    String question = String.valueOf(body.getOrDefault("message", body.getOrDefault("prompt", body.getOrDefault("query", ""))));
    if (geminiKey == null || geminiKey.isBlank()) {
      Map<String,Object> fallback = Map.of("reply", "Gemini is not configured yet. Set GEMINI_API_KEY in the notification service environment to enable company-aware answers.", "configured", false);
      try {
        db.update("insert into ai_chat_history(company_id,user_id,question,answer,message,sender_type) values(?,?,?,?,?,?)", company(claims), user(claims), question, fallback.get("reply"), question, "USER");
      } catch (Exception ignored) {}
      return fallback;
    }
    long tenant = company(claims);
    Map<String,Object> context = new LinkedHashMap<>();
    context.put("assets", safeCount("select count(*) from assets where company_id=? and is_active=true", tenant));
    context.put("employees", safeCount("select count(*) from users where company_id=? and is_active=true", tenant));
    context.put("departments", safeCount("select count(*) from departments where company_id=? and is_active=true", tenant));
    context.put("openRequests", safeCount("select count(*) from asset_requests where company_id=? and is_active=true and status in ('PENDING','OPEN')", tenant));
    context.put("openMaintenance", safeCount("select count(*) from maintenance where company_id=? and is_active=true and status not in ('COMPLETED','CANCELLED')", tenant));
    String grounded = "You are AssetFlow's internal assistant. Answer only from the tenant context below and general asset-management guidance. Never invent tenant records, IDs, users, or cross-company data. If the context is insufficient, say so. Tenant context: " + context + ". User question: " + question;
    Map<String,Object> result = chat(Map.of("message", grounded));
    try {
      db.update("insert into ai_chat_history(company_id,user_id,question,answer,message,sender_type) values(?,?,?,?,?,?)", tenant, user(claims), question, result.get("reply"), question, "USER");
    } catch (Exception ignored) {}
    return result;
  }

  private long safeCount(String sql, long tenant) {
    try {
      Long value = db.queryForObject(sql, Long.class, tenant);
      return value == null ? 0 : value;
    } catch (Exception ignored) {
      return 0;
    }
  }
}
