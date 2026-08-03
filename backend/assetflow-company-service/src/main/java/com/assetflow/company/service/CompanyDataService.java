package com.assetflow.company.service;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Service
public class CompanyDataService {
	private final JdbcTemplate db;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	public CompanyDataService(JdbcTemplate db) {
		this.db = db;
	}

	private void owned(String table, String key, Long id, Long companyId) {
		Integer n = db.queryForObject("select count(*) from " + table + " where " + key + "=? and company_id=?",
				Integer.class, id, companyId);
		if (n == null || n == 0)
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
	}

	public List<Map<String, Object>> list(String type, Long company, Long actorId, String role, String q, int page, int size) {
		page = Math.max(page, 0); size = Math.min(Math.max(size, 1), 100);
		String table = table(type), sql = "select * from " + table + " where company_id=? and is_active=true";
		List<Object> a = new ArrayList<>();
		a.add(company);
		if (q != null && !q.isBlank()) {
			String col = type.equals("employee") ? "email"
					: type.equals("department") ? "department_name"
							: type.equals("location") ? "location_name"
									: type.equals("building") ? "building_name" : type.equals("floor") ? "floor_name" : type.equals("room") ? "room_name" : "company_name";
			sql += " and " + col + " like ?";
			a.add("%" + q + "%");
		}
		if (type.equals("employee") || type.equals("admin")) {
			sql += " and role_id=(select role_id from roles where role_name=?)";
			a.add(type.equals("admin") ? "COMPANY_ADMIN" : "EMPLOYEE");
		}
		if ("EMPLOYEE".equals(role)) {
			if (!"employee".equals(type))
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee access is limited to their own profile");
			sql += " and user_id=?";
			a.add(actorId);
		}
		sql += " order by 1 desc limit ? offset ?";
		a.add(size); a.add(page * size);
		return db.queryForList(sql, a.toArray());
	}

	public Map<String, Object> one(String type, Long company, Long actorId, String role, Long id) {
		String table = table(type), key = key(type);
		owned(table, key, id, company);
		if ("EMPLOYEE".equals(role) && (!"employee".equals(type) || !Objects.equals(actorId, id)))
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee access is limited to their own profile");
		return db.queryForMap("select * from " + table + " where " + key + "=?", id);
	}

	@Transactional
	public Map<String, Object> create(String type, Long company, Long actorId, Map<String, Object> b) {
		validateReferences(type, company, b);
		if ((type.equals("employee") || type.equals("admin")) && (b.get("password") == null || String.valueOf(b.get("password")).length() < 8))
			throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "A temporary password of at least 8 characters is required");
		switch (type) {
		case "department" -> db.update("insert into departments(company_id,department_name,description) values(?,?,?)",
				company, b.get("name"), b.get("description"));
		case "location" -> db.update(
				"insert into locations(company_id,location_name,address,city,state,country,postal_code) values(?,?,?,?,?,?,?)",
				company, b.get("name"), b.get("address"), b.get("city"), b.get("state"), b.get("country"),
				b.get("postalCode"));
		case "building" -> db.update("insert into buildings(company_id,building_name,address) values(?,?,?)", company, b.get("name"), b.get("address"));
		case "floor" -> db.update("insert into floors(company_id,building_id,floor_name) values(?,?,?)", company, b.get("buildingId"), b.get("name"));
		case "room" -> db.update("insert into rooms(company_id,floor_id,room_name) values(?,?,?)", company, b.get("floorId"), b.get("name"));
		case "employee", "admin" -> {
			Long role = db.queryForObject("select role_id from roles where role_name=?", Long.class,
					type.equals("admin") ? "COMPANY_ADMIN" : "EMPLOYEE");
			db.update(
					"insert into users(company_id,department_id,role_id,first_name,last_name,email,password,phone) values(?,?,?,?,?,?,?,?)",
					company, b.get("departmentId"), role, b.get("firstName"), b.get("lastName"), b.get("email"),
					passwordEncoder.encode(String.valueOf(b.get("password"))), b.get("phone"));
		}
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		}
		// Return the database row so clients receive the generated identifier and audit columns.
		String table = table(type), key = key(type);
		Map<String,Object> created = db.queryForMap("select * from " + table + " where company_id=? order by " + key + " desc limit 1", company);
		audit(company, actorId, type, "CREATE", String.valueOf(created.get(key)), "Created " + type);
		return created;
	}

	public Map<String, Object> importEmployees(Long company, Long actorId, List<Map<String, Object>> rows) {
		int accepted = 0;
		List<Map<String, Object>> rejected = new ArrayList<>();
		for (int i = 0; i < (rows == null ? 0 : rows.size()); i++) {
			Map<String, Object> row = rows.get(i);
			try {
				if (row.get("email") == null || row.get("password") == null)
					throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "email and password are required");
				create("employee", company, actorId, row);
				accepted++;
			} catch (RuntimeException ex) {
				rejected.add(Map.of("row", i + 1, "reason", ex.getMessage() == null ? "Invalid row" : ex.getMessage()));
			}
		}
		return Map.of("accepted", accepted, "rejected", rejected, "total", rows == null ? 0 : rows.size());
	}

	public void delete(String type, Long company, Long actorId, Long id) {
		String table = table(type), key = key(type);
		owned(table, key, id, company);
		db.update("update " + table + " set is_active=false where " + key + "=?", id);
		audit(company, actorId, type, "DELETE", String.valueOf(id), "Archived " + type + " #" + id);
	}
	@Transactional public Map<String,Object> update(String type, Long company, Long actorId, Long id, Map<String,Object> b) {
		String table=table(type), key=key(type); owned(table,key,id,company);
		validateReferences(type, company, b);
		if (type.equals("department")) db.update("update departments set department_name=?,description=? where department_id=? and company_id=?", b.get("name"),b.get("description"),id,company);
		else if (type.equals("location")) db.update("update locations set location_name=?,address=?,city=?,state=?,country=?,postal_code=? where location_id=? and company_id=?",b.get("name"),b.get("address"),b.get("city"),b.get("state"),b.get("country"),b.get("postalCode"),id,company);
		else if (type.equals("building")) db.update("update buildings set building_name=?,address=? where building_id=? and company_id=?",b.get("name"),b.get("address"),id,company);
		else if (type.equals("floor")) db.update("update floors set building_id=?,floor_name=? where floor_id=? and company_id=?",b.get("buildingId"),b.get("name"),id,company);
		else if (type.equals("room")) db.update("update rooms set floor_id=?,room_name=? where room_id=? and company_id=?",b.get("floorId"),b.get("name"),id,company);
		else db.update("update users set first_name=?,last_name=?,phone=?,department_id=? where user_id=? and company_id=?",b.get("firstName"),b.get("lastName"),b.get("phone"),b.get("departmentId"),id,company);
		Map<String,Object> updated = one(type,company,actorId,"COMPANY_ADMIN",id);
		audit(company, actorId, type, "UPDATE", String.valueOf(id), "Updated " + type + " #" + id);
		return updated;
	}
	private void audit(Long company, Long actorId, String module, String action, String entityId, String description) {
		try { db.update("insert into audit_logs(company_id,user_id,module,action,entity_id,description) values(?,?,?,?,?,?)", company, actorId, module, action, entityId, description); }
		catch (RuntimeException ignored) { /* audit failures must not roll back the business transaction */ }
	}

	private String table(String t) {
		return switch (t) {
		case "department" -> "departments";
		case "location" -> "locations";
		case "building" -> "buildings";
		case "floor" -> "floors";
		case "room" -> "rooms";
		case "employee", "admin" -> "users";
		default -> "companies";
		};
	}

	private void validateReferences(String type, Long company, Map<String, Object> body) {
		Map<String, String> refs = new LinkedHashMap<>();
		if (type.equals("floor")) refs.put("buildingId", "buildings:building_id");
		if (type.equals("room")) refs.put("floorId", "floors:floor_id");
		if (type.equals("employee") || type.equals("admin")) refs.put("departmentId", "departments:department_id");
		for (Map.Entry<String, String> ref : refs.entrySet()) {
			Object id = body.get(ref.getKey());
			if (id == null || String.valueOf(id).isBlank()) continue;
			String[] target = ref.getValue().split(":", 2);
			Integer count = db.queryForObject("select count(*) from " + target[0] + " where " + target[1] + "=? and company_id=?", Integer.class, id, company);
			if (count == null || count == 0) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Referenced " + ref.getKey() + " does not belong to this company");
		}
	}

	private String key(String t) {
		return switch (t) {
		case "department" -> "department_id";
		case "location" -> "location_id";
		case "building" -> "building_id";
		case "floor" -> "floor_id";
		case "room" -> "room_id";
		case "employee", "admin" -> "user_id";
		default -> "company_id";
		};
	}
}
