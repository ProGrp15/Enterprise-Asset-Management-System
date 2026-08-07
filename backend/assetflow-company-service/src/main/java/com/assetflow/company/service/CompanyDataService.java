package com.assetflow.company.service;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CompanyDataService {
  private final JdbcTemplate db;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

  public CompanyDataService(JdbcTemplate db) {
    this.db = db;
  }

  public List<Map<String,Object>> list(String type, Long company, Long actor, String role, String q, int page, int size) {
    page = Math.max(0, page);
    size = Math.min(Math.max(1, size), 100);
    String sql = baseQuery(type);
    List<Object> a = new ArrayList<>(List.of(company));

    if (q != null && !q.isBlank()) {
      String f = "employee".equals(type) || "admin".equals(type)
          ? "(u.email like ? or u.first_name like ? or u.last_name like ? or d.department_name like ?)"
          : "department".equals(type)
          ? "(d.department_name like ? or d.description like ?)"
          : "(l.location_name like ? or l.city like ? or l.state like ?)";
      sql += " and " + f;
      long marks = f.chars().filter(c -> c == '?').count();
      for (int i = 0; i < marks; i++) a.add("%" + q + "%");
    }

    if (Set.of("employee", "admin").contains(type)) {
      sql += " and u.role_id=(select role_id from roles where role_name=?)";
      a.add("admin".equals(type) ? "COMPANY_ADMIN" : "EMPLOYEE");
    }

    if ("EMPLOYEE".equals(role)) {
      if (!"employee".equals(type)) throw forbidden();
      sql += " and u.user_id=?";
      a.add(actor);
    }

    sql += " order by " + qualifiedKey(type) + " desc limit ? offset ?";
    a.add(size);
    a.add(page * size);

    return db.queryForList(sql, a.toArray());
  }

  public Map<String,Object> one(String type, Long company, Long actor, String role, Long id) {
    owned(type, company, id);
    if ("EMPLOYEE".equals(role) && (!"employee".equals(type) || !Objects.equals(actor, id))) {
      throw forbidden();
    }
    String sql = baseQuery(type) + " and " + qualifiedKey(type) + "=?";
    return db.queryForMap(sql, company, id);
  }

  @Transactional
  public Map<String,Object> create(String type, Long company, Long actor, Map<String,Object> b) {
    validateCreate(type, company, b);
    switch (type) {
      case "department" -> {
        Object name = b.get("departmentName") != null ? b.get("departmentName") : b.get("name");
        db.update("insert into departments(company_id,department_name,description) values(?,?,?)",
            company, name, b.get("description"));
      }
      case "location" -> {
        Object name = b.get("locationName") != null ? b.get("locationName") : b.get("name");
        db.update("insert into locations(company_id,location_name,address,city,state,country,postal_code) values(?,?,?,?,?,?,?)",
            company, name, b.get("address"), b.get("city"), b.get("state"), b.get("country"), b.get("postalCode"));
      }
      case "employee", "admin" -> {
        Long r = db.queryForObject("select role_id from roles where role_name=?", Long.class, "admin".equals(type) ? "COMPANY_ADMIN" : "EMPLOYEE");
        db.update("insert into users(company_id,department_id,role_id,first_name,last_name,email,password,phone) values(?,?,?,?,?,?,?,?)",
            company, b.get("departmentId"), r, b.get("firstName"), b.get("lastName"), b.get("email"), encoder.encode(String.valueOf(b.get("password"))), b.get("phone"));
      }
      default -> throw bad();
    }
    Long newId = db.queryForObject("select " + key(type) + " from " + table(type) + " where company_id=? order by " + key(type) + " desc limit 1", Long.class, company);
    audit(company, actor, type, "CREATE", String.valueOf(newId), "Created " + type);
    return one(type, company, actor, "COMPANY_ADMIN", newId);
  }

  public Map<String,Object> importEmployees(Long company, Long actor, List<Map<String,Object>> rows) {
    int ok = 0;
    List<Map<String,Object>> bad = new ArrayList<>();
    for (int i = 0; i < (rows == null ? 0 : rows.size()); i++) {
      try {
        create("employee", company, actor, rows.get(i));
        ok++;
      } catch (Exception e) {
        bad.add(Map.of("row", i + 1, "reason", String.valueOf(e.getMessage())));
      }
    }
    return Map.of("accepted", ok, "rejected", bad, "total", rows == null ? 0 : rows.size());
  }

  @Transactional
  public Map<String,Object> update(String type, Long company, Long actor, Long id, Map<String,Object> b) {
    owned(type, company, id);
    validateUpdate(type, company, b);
    if ("department".equals(type)) {
      Object name = b.get("departmentName") != null ? b.get("departmentName") : b.get("name");
      db.update("update departments set department_name=?,description=?,is_active=? where department_id=? and company_id=?",
          name, b.get("description"), b.getOrDefault("isActive", true), id, company);
    } else if ("location".equals(type)) {
      Object name = b.get("locationName") != null ? b.get("locationName") : b.get("name");
      db.update("update locations set location_name=?,address=?,city=?,state=?,country=?,postal_code=?,is_active=? where location_id=? and company_id=?",
          name, b.get("address"), b.get("city"), b.get("state"), b.get("country"), b.get("postalCode"), b.getOrDefault("isActive", true), id, company);
    } else if (Set.of("employee", "admin").contains(type)) {
      db.update("update users set first_name=?,last_name=?,phone=?,department_id=?,is_active=? where user_id=? and company_id=?",
          b.get("firstName"), b.get("lastName"), b.get("phone"), b.get("departmentId"), b.getOrDefault("isActive", true), id, company);
    } else {
      throw bad();
    }
    Map<String,Object> row = one(type, company, actor, "COMPANY_ADMIN", id);
    audit(company, actor, type, "UPDATE", String.valueOf(id), "Updated " + type);
    return row;
  }

  public void delete(String type, Long company, Long actor, Long id) {
    owned(type, company, id);
    db.update("update " + table(type) + " set is_active=false where " + key(type) + "=? and company_id=?", id, company);
    audit(company, actor, type, "DELETE", String.valueOf(id), "Deactivated " + type);
  }

  private String baseQuery(String type) {
    return switch (type) {
      case "department" -> "select d.*, d.department_name as name, (select count(*) from users u where u.department_id=d.department_id and u.company_id=d.company_id and u.is_active=true) as total_employees from departments d where d.company_id=? and d.is_active=true";
      case "location" -> "select l.*, l.location_name as name, (select count(*) from assets a where a.location_id=l.location_id and a.company_id=l.company_id and a.is_active=true) as total_assets from locations l where l.company_id=? and l.is_active=true";
      case "employee", "admin" -> "select u.user_id, u.company_id, u.department_id, u.role_id, u.first_name, u.last_name, concat(u.first_name, ' ', u.last_name) as full_name, u.email, u.phone, u.is_active, u.created_at, u.updated_at, d.department_name, r.role_name as role, r.role_name as role_name from users u left join departments d on d.department_id=u.department_id join roles r on r.role_id=u.role_id where u.company_id=? and u.is_active=true";
      default -> throw bad();
    };
  }

  private String qualifiedKey(String t) {
    return switch (t) {
      case "department" -> "d.department_id";
      case "location" -> "l.location_id";
      case "employee", "admin" -> "u.user_id";
      default -> throw bad();
    };
  }

  private void validateCreate(String type, Long company, Map<String,Object> b) {
    if (Set.of("employee", "admin").contains(type)) {
      if (blank(b.get("password")) || String.valueOf(b.get("password")).length() < 8) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "A password of at least 8 characters is required");
      }
      if (blank(b.get("email"))) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Email is required");
      }
      Integer n = db.queryForObject("select count(*) from users where email=?", Integer.class, b.get("email"));
      if (n != null && n > 0) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
      }
    }
    validateNames(type, b);
    validateDepartment(company, b);
  }

  private void validateUpdate(String type, Long company, Map<String,Object> b) {
    if (Set.of("employee", "admin").contains(type) && (blank(b.get("firstName")) || blank(b.get("lastName")))) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "First and last name are required");
    }
    validateNames(type, b);
    validateDepartment(company, b);
  }

  private void validateNames(String type, Map<String,Object> b) {
    Object depName = b.get("departmentName") != null ? b.get("departmentName") : b.get("name");
    Object locName = b.get("locationName") != null ? b.get("locationName") : b.get("name");
    if ("department".equals(type) && blank(depName)) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Department name is required");
    }
    if ("location".equals(type) && blank(locName)) {
      throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Location name is required");
    }
  }

  private void validateDepartment(Long company, Map<String,Object> b) {
    if (b.get("departmentId") != null && !String.valueOf(b.get("departmentId")).isBlank()) {
      Integer n = db.queryForObject("select count(*) from departments where department_id=? and company_id=?", Integer.class, b.get("departmentId"), company);
      if (n == null || n == 0) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Department does not belong to this company");
      }
    }
  }

  private boolean blank(Object o) {
    return o == null || String.valueOf(o).isBlank();
  }

  private void owned(String type, Long company, Long id) {
    Integer n = db.queryForObject("select count(*) from " + table(type) + " where " + key(type) + "=? and company_id=?", Integer.class, id, company);
    if (n == null || n == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
    }
  }

  private void audit(Long c, Long u, String m, String a, String e, String d) {
    try {
      db.update("insert into audit_logs(company_id,user_id,module,action,entity_id,description) values(?,?,?,?,?,?)", c, u, m, a, e, d);
    } catch (Exception ignored) {}
  }

  private String table(String t) {
    return switch (t) {
      case "department" -> "departments";
      case "location" -> "locations";
      case "employee", "admin" -> "users";
      default -> throw bad();
    };
  }

  private String key(String t) {
    return switch (t) {
      case "department" -> "department_id";
      case "location" -> "location_id";
      case "employee", "admin" -> "user_id";
      default -> throw bad();
    };
  }

  private ResponseStatusException bad() {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
  }

  private ResponseStatusException forbidden() {
    return new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee access is limited to their own profile");
  }
}
