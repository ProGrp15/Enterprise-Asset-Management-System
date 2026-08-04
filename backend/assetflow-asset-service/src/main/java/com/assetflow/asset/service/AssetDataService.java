package com.assetflow.asset.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssetDataService {
	private final JdbcTemplate db;

	public AssetDataService(JdbcTemplate db) {
		this.db = db;
	}

	public List<Map<String, Object>> list(String type, Long companyId, Long userId, String role, String search, int page, int size) {
		page=Math.max(0,page);size=Math.min(Math.max(1,size),100);String sql="select * from "+table(type)+" where company_id=?";List<Object> args=new ArrayList<>();args.add(companyId);
		if ("EMPLOYEE".equals(role)) {
			if (!("asset".equals(type) || "category".equals(type) || "asset-request".equals(type) || "asset-return".equals(type) || "maintenance".equals(type)))
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee access is limited to assigned assets and employee requests");
			String scoped = switch (type) {
			case "asset" -> "asset_id in (select asset_id from asset_allocations where company_id=? and employee_id=? and allocation_status='ACTIVE')";
			case "category" -> null;
			case "asset-request" -> "employee_id=?";
			case "asset-return" -> "employee_id=?";
			case "maintenance" -> "employee_id=?";
			default -> null;
			};
			if (scoped != null) {
				sql += " and " + scoped;
				if ("asset".equals(type)) args.add(companyId);
				args.add(userId);
			}
		}
		if(search!=null&&!search.isBlank()){
			String searchable = switch (type) {
			case "asset" -> "asset_name like ? or asset_tag like ? or serial_number like ? or status like ?";
			case "category" -> "category_name like ? or description like ?";
			case "vendor" -> "vendor_name like ? or contact_person like ? or email like ?";
			case "purchase-order" -> "order_number like ? or status like ?";
			case "invoice" -> "invoice_number like ? or status like ?";
			case "maintenance" -> "issue_description like ? or status like ?";
			default -> "cast("+key(type)+" as char) like ?";
			};
			sql += " and (" + searchable + ")";
			int placeholders = searchable.length() - searchable.replace("?", "").length();
			for (int i = 0; i < placeholders; i++) args.add("%" + search + "%");
		}
		sql+=" order by 1 desc limit ? offset ?";args.add(size);args.add(page*size);return db.queryForList(sql,args.toArray());
	}

	public Map<String, Object> one(String type, Long companyId, Long userId, String role, Long id) {
		ensureOwned(type, companyId, id);
		if ("EMPLOYEE".equals(role)) {
			if ("asset".equals(type)) {
				ensureAssignedAsset(companyId, userId, id);
			} else if ("asset-request".equals(type) || "asset-return".equals(type) || "maintenance".equals(type)) {
				String employeeColumn = "maintenance".equals(type) ? "employee_id" : "employee_id";
				Integer owned = db.queryForObject("select count(*) from " + table(type) + " where " + key(type) + "=? and company_id=? and " + employeeColumn + "=?", Integer.class, id, companyId, userId);
				if (owned == null || owned == 0) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This record does not belong to you");
			} else {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee access is limited to assigned assets and employee requests");
			}
		}
		return db.queryForMap("select * from " + table(type) + " where " + key(type) + "=?", id);
	}

	public void ensureEmployeeAsset(Long companyId, Long employeeId, Object assetId) {
		if (assetId == null || String.valueOf(assetId).isBlank())
			throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "An assigned asset is required");
		ensureAssignedAsset(companyId, employeeId, Long.valueOf(String.valueOf(assetId)));
	}

	private void ensureAssignedAsset(Long companyId, Long employeeId, Long assetId) {
		Integer assigned = db.queryForObject("select count(*) from asset_allocations where company_id=? and asset_id=? and employee_id=? and allocation_status='ACTIVE'", Integer.class, companyId, assetId, employeeId);
		if (assigned == null || assigned == 0) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This asset is not assigned to you");
	}

	@Transactional
	public Map<String, Object> create(String type, Long companyId, Long actorId, Map<String, Object> body) {
		validateReferences(type, companyId, body);
		switch (type) {
		case "asset" -> db.update(
				"insert into assets(company_id,category_id,vendor_id,asset_name,asset_tag,serial_number,manufacturer,model,purchase_date,purchase_cost,warranty_expiry,status,remarks) values(?,?,?,?,?,?,?,?,?,?,?,?,?)",
				companyId, body.get("categoryId"), body.get("vendorId"), body.get("assetName"), body.get("assetTag"),
				body.get("serialNumber"), body.get("manufacturer"), body.get("model"), body.get("purchaseDate"),
				body.get("purchaseCost"), body.get("warrantyExpiry"), body.getOrDefault("status", "AVAILABLE"),
				body.get("remarks"));
		case "category" -> db.update(
				"insert into asset_categories(company_id,category_name,description) values(?,?,?)",
				companyId, body.get("categoryName"), body.get("description"));
		case "vendor" -> db.update(
				"insert into vendors(company_id,vendor_name,contact_person,email,phone,address) values(?,?,?,?,?,?)",
				companyId, body.get("vendorName"), body.get("contactPerson"), body.get("email"), body.get("phone"),
				body.get("address"));
		case "purchase-order" -> db.update(
				"insert into purchase_orders(company_id,vendor_id,order_number,order_date,expected_delivery_date,total_amount,status,remarks) values(?,?,?,?,?,?,?,?)",
				companyId, body.get("vendorId"), body.get("orderNumber"), body.get("orderDate"),
				body.get("expectedDeliveryDate"), body.get("totalAmount"), body.getOrDefault("status", "DRAFT"),
				body.get("remarks"));
		case "invoice" -> db.update("insert into invoices(company_id,vendor_id,purchase_order_id,invoice_number,invoice_date,total_amount,status) values(?,?,?,?,?,?,?)", companyId, body.get("vendorId"), body.get("purchaseOrderId"), body.get("invoiceNumber"), body.get("invoiceDate"), body.get("totalAmount"), body.getOrDefault("status", "RECEIVED"));
		case "maintenance" -> db.update(
				"insert into service_tickets(company_id,asset_id,employee_id,issue_description,priority,status) values(?,?,?,?,?,?)",
				companyId, body.get("assetId"), body.get("employeeId"), body.get("issueDescription"),
				body.getOrDefault("priority", "MEDIUM"), body.getOrDefault("status", "OPEN"));
		case "asset-allocation" -> db.update(
				"insert into asset_allocations(company_id,asset_id,employee_id,allocated_by,allocated_date,expected_return_date,allocation_status,remarks) values(?,?,?,?,?,?,?,?)",
				companyId, body.get("assetId"), body.get("employeeId"), body.get("allocatedBy"),
				body.get("allocatedDate"), body.get("expectedReturnDate"), body.getOrDefault("allocationStatus", "ACTIVE"),
				body.get("remarks"));
		case "asset-request" -> db.update(
				"insert into asset_requests(company_id,employee_id,category_id,asset_id,approved_by,request_type,reason,status) values(?,?,?,?,?,?,?,?)",
				companyId, body.get("employeeId"), body.get("categoryId"), body.get("assetId"), body.get("approvedBy"),
				body.get("requestType"), body.get("reason"), body.getOrDefault("status", "PENDING"));
		case "asset-transfer" -> db.update("insert into asset_transfers(company_id,asset_id,from_employee_id,to_employee_id,from_location_id,to_location_id,requested_by,status,reason) values(?,?,?,?,?,?,?,?,?)", companyId, body.get("assetId"), body.get("fromEmployeeId"), body.get("toEmployeeId"), body.get("fromLocationId"), body.get("toLocationId"), body.get("requestedBy"), body.getOrDefault("status", "PENDING"), body.get("reason"));
		case "asset-return" -> db.update("insert into asset_returns(company_id,asset_id,employee_id,requested_by,condition_status,remarks,status) values(?,?,?,?,?,?,?)", companyId, body.get("assetId"), body.get("employeeId"), body.get("requestedBy"), body.get("conditionStatus"), body.get("remarks"), body.getOrDefault("status", "PENDING"));
		case "asset-disposal" -> db.update("insert into asset_disposals(company_id,asset_id,requested_by,disposal_type,reason,disposal_date,status) values(?,?,?,?,?,?,?)", companyId, body.get("assetId"), body.get("requestedBy"), body.getOrDefault("disposalType","SCRAP"), body.get("reason"), body.get("disposalDate"), body.getOrDefault("status","PENDING"));
		case "repair-history" -> db.update("insert into repair_history(company_id,asset_id,technician_id,issue_description,repair_action,cost,started_at,completed_at,status) values(?,?,?,?,?,?,?,?,?)", companyId, body.get("assetId"), body.get("technicianId"), body.get("issueDescription"), body.get("repairAction"), body.get("cost"), body.get("startedAt"), body.get("completedAt"), body.getOrDefault("status","OPEN"));
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		}
		applyLifecycle(type, companyId, body);
		audit(companyId, actorId, type, "CREATE", "Created " + type);
		notifyFor(type, companyId, body);
		// Return the persisted row (including its generated identifier) so the UI can immediately edit,
		// delete, or use the new record in the next workflow step.
		return db.queryForMap("select * from " + table(type) + " where company_id=? order by " + key(type) + " desc limit 1", companyId);
	}

	@Transactional
	public Map<String, Object> update(String type, Long companyId, Long actorId, Long id, Map<String, Object> body) {
		ensureOwned(type, companyId, id);
		validateReferences(type, companyId, body);
		switch (type) {
		case "asset" -> db.update(
				"update assets set category_id=?,vendor_id=?,asset_name=?,asset_tag=?,serial_number=?,manufacturer=?,model=?,purchase_date=?,purchase_cost=?,warranty_expiry=?,status=?,remarks=? where asset_id=?",
				body.get("categoryId"), body.get("vendorId"), body.get("assetName"), body.get("assetTag"),
				body.get("serialNumber"), body.get("manufacturer"), body.get("model"), body.get("purchaseDate"),
				body.get("purchaseCost"), body.get("warrantyExpiry"), body.getOrDefault("status", "AVAILABLE"),
				body.get("remarks"), id);
		case "category" -> db.update("update asset_categories set category_name=?,description=?,is_active=? where category_id=?",
				body.get("categoryName"), body.get("description"), body.getOrDefault("isActive", true), id);
		case "vendor" -> db.update("update vendors set vendor_name=?,contact_person=?,email=?,phone=?,address=?,is_active=? where vendor_id=?",
				body.get("vendorName"), body.get("contactPerson"), body.get("email"), body.get("phone"),
				body.get("address"), body.getOrDefault("isActive", true), id);
		case "purchase-order" -> db.update("update purchase_orders set vendor_id=?,order_number=?,order_date=?,expected_delivery_date=?,total_amount=?,status=?,remarks=? where purchase_order_id=?",
				body.get("vendorId"), body.get("orderNumber"), body.get("orderDate"), body.get("expectedDeliveryDate"),
				body.get("totalAmount"), body.getOrDefault("status", "DRAFT"), body.get("remarks"), id);
		case "invoice" -> db.update("update invoices set vendor_id=?,purchase_order_id=?,invoice_number=?,invoice_date=?,total_amount=?,status=? where invoice_id=?", body.get("vendorId"), body.get("purchaseOrderId"), body.get("invoiceNumber"), body.get("invoiceDate"), body.get("totalAmount"), body.getOrDefault("status", "RECEIVED"), id);
		case "maintenance" -> db.update("update service_tickets set asset_id=?,employee_id=?,issue_description=?,priority=?,status=?,resolved_at=? where ticket_id=?",
				body.get("assetId"), body.get("employeeId"), body.get("issueDescription"), body.getOrDefault("priority", "MEDIUM"),
				body.getOrDefault("status", "OPEN"), body.get("resolvedAt"), id);
		case "asset-allocation" -> db.update("update asset_allocations set asset_id=?,employee_id=?,allocated_by=?,allocated_date=?,expected_return_date=?,returned_date=?,allocation_status=?,remarks=? where allocation_id=?",
				body.get("assetId"), body.get("employeeId"), body.get("allocatedBy"), body.get("allocatedDate"),
				body.get("expectedReturnDate"), body.get("returnedDate"), body.getOrDefault("allocationStatus", "ACTIVE"),
				body.get("remarks"), id);
		case "asset-request" -> db.update("update asset_requests set employee_id=?,category_id=?,asset_id=?,approved_by=?,request_type=?,reason=?,status=? where request_id=?",
				body.get("employeeId"), body.get("categoryId"), body.get("assetId"), body.get("approvedBy"),
				body.get("requestType"), body.get("reason"), body.getOrDefault("status", "PENDING"), id);
		case "asset-transfer" -> db.update("update asset_transfers set asset_id=?,from_employee_id=?,to_employee_id=?,from_location_id=?,to_location_id=?,approved_by=?,status=?,reason=? where transfer_id=?", body.get("assetId"), body.get("fromEmployeeId"), body.get("toEmployeeId"), body.get("fromLocationId"), body.get("toLocationId"), body.get("approvedBy"), body.getOrDefault("status", "PENDING"), body.get("reason"), id);
		case "asset-return" -> db.update("update asset_returns set asset_id=?,employee_id=?,approved_by=?,condition_status=?,remarks=?,status=?,returned_at=? where return_id=?", body.get("assetId"), body.get("employeeId"), body.get("approvedBy"), body.get("conditionStatus"), body.get("remarks"), body.getOrDefault("status", "PENDING"), body.get("returnedAt"), id);
		case "asset-disposal" -> db.update("update asset_disposals set asset_id=?,disposal_type=?,reason=?,disposal_date=?,status=?,approved_by=? where disposal_id=?", body.get("assetId"), body.getOrDefault("disposalType","SCRAP"), body.get("reason"), body.get("disposalDate"), body.getOrDefault("status","PENDING"), body.get("approvedBy"), id);
		case "repair-history" -> db.update("update repair_history set asset_id=?,technician_id=?,issue_description=?,repair_action=?,cost=?,started_at=?,completed_at=?,status=? where repair_id=?", body.get("assetId"), body.get("technicianId"), body.get("issueDescription"), body.get("repairAction"), body.get("cost"), body.get("startedAt"), body.get("completedAt"), body.getOrDefault("status","OPEN"), id);
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		}
		applyLifecycle(type, companyId, body);
		audit(companyId, actorId, type, "UPDATE", "Updated " + type + " #" + id);
		notifyFor(type, companyId, body);
		return body;
	}

	@Transactional
	public void delete(String type, Long companyId, Long actorId, Long id) {
		ensureOwned(type, companyId, id);
		if ("purchase-order".equals(type)) {
			db.update("delete from purchase_orders where purchase_order_id=?", id);
			audit(companyId, actorId, type, "DELETE", "Deleted " + type + " #" + id);
			return;
		}
		String table = table(type), key = key(type);
		db.update("delete from " + table + " where " + key + "=?", id);
		audit(companyId, actorId, type, "DELETE", "Deleted " + type + " #" + id);
	}

	private void audit(Long companyId, Long actorId, String module, String action, String description) {
		db.update("insert into audit_logs(company_id,user_id,module,action,description) values(?,?,?,?,?)", companyId, actorId, module, action, description);
	}

	private void validateReferences(String type, Long companyId, Map<String, Object> body) {
		Map<String, String> required = new LinkedHashMap<>();
		if ("asset".equals(type)) {
			required.put("assetName", "Asset name"); required.put("assetTag", "Asset tag"); required.put("serialNumber", "Serial number");
			required.put("categoryId", "Category"); required.put("vendorId", "Vendor");
		}
		if ("vendor".equals(type)) required.put("vendorName", "Vendor name");
		if ("category".equals(type)) required.put("categoryName", "Category name");
		for (Map.Entry<String,String> field : required.entrySet()) {
			if (body.get(field.getKey()) == null || String.valueOf(body.get(field.getKey())).isBlank())
				throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, field.getValue() + " is required");
		}
		Map<String, String> refs = new LinkedHashMap<>();
		switch (type) {
			case "asset" -> { refs.put("categoryId", "asset_categories:category_id"); refs.put("vendorId", "vendors:vendor_id"); }
			case "purchase-order" -> refs.put("vendorId", "vendors:vendor_id");
			case "invoice" -> { refs.put("vendorId", "vendors:vendor_id"); refs.put("purchaseOrderId", "purchase_orders:purchase_order_id"); }
			case "maintenance" -> { refs.put("assetId", "assets:asset_id"); refs.put("employeeId", "users:user_id"); }
			case "asset-allocation" -> { refs.put("assetId", "assets:asset_id"); refs.put("employeeId", "users:user_id"); refs.put("allocatedBy", "users:user_id"); }
			case "asset-request" -> { refs.put("assetId", "assets:asset_id"); refs.put("categoryId", "asset_categories:category_id"); refs.put("employeeId", "users:user_id"); refs.put("approvedBy", "users:user_id"); }
			case "asset-transfer" -> { refs.put("assetId", "assets:asset_id"); refs.put("fromEmployeeId", "users:user_id"); refs.put("toEmployeeId", "users:user_id"); refs.put("fromLocationId", "locations:location_id"); refs.put("toLocationId", "locations:location_id"); refs.put("requestedBy", "users:user_id"); refs.put("approvedBy", "users:user_id"); }
			case "asset-return" -> { refs.put("assetId", "assets:asset_id"); refs.put("employeeId", "users:user_id"); refs.put("requestedBy", "users:user_id"); refs.put("approvedBy", "users:user_id"); }
			case "asset-disposal" -> { refs.put("assetId", "assets:asset_id"); refs.put("requestedBy", "users:user_id"); refs.put("approvedBy", "users:user_id"); }
			case "repair-history" -> { refs.put("assetId", "assets:asset_id"); refs.put("technicianId", "users:user_id"); }
			default -> { }
		}
		for (Map.Entry<String, String> ref : refs.entrySet()) {
			Object id = body.get(ref.getKey());
			if (id == null || String.valueOf(id).isBlank()) continue;
			String[] target = ref.getValue().split(":", 2);
			Integer count = db.queryForObject("select count(*) from " + target[0] + " where " + target[1] + "=? and company_id=?", Integer.class, id, companyId);
			if (count == null || count == 0) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Referenced " + ref.getKey() + " does not belong to this company");
		}
	}

	private void notifyFor(String type, Long companyId, Map<String, Object> body) {
		Object target = switch (type) {
		case "asset-allocation" -> body.get("employeeId");
		case "asset-transfer" -> body.get("toEmployeeId");
		case "asset-return" -> body.get("employeeId");
		case "asset-request" -> body.get("employeeId");
		case "maintenance" -> body.get("employeeId");
		default -> null;
		};
		if (target == null || String.valueOf(target).isBlank()) return;
		try { db.update("insert into notifications(company_id,user_id,title,message) values(?,?,?,?)", companyId, target, "AssetFlow update", "Your " + type.replace('-', ' ') + " has been updated."); }
		catch (Exception ignored) { /* notifications never invalidate the completed lifecycle change */ }
	}

	/** Keep the inventory status in sync with lifecycle records. These transitions are deliberately
	 * idempotent so retries from the UI do not corrupt the asset state. */
	private void applyLifecycle(String type, Long companyId, Map<String, Object> body) {
		Object assetId = body.get("assetId");
		if (assetId == null) return;
		String status = String.valueOf(body.getOrDefault("status", "")).toUpperCase();
		if ("asset-allocation".equals(type) && !status.equals("CANCELLED"))
			db.update("update assets set status=? where asset_id=? and company_id=?", "ASSIGNED", assetId, companyId);
		else if ("asset-return".equals(type) && (status.equals("APPROVED") || status.equals("COMPLETED")))
			db.update("update assets set status=? where asset_id=? and company_id=?", "AVAILABLE", assetId, companyId);
		else if ("asset-disposal".equals(type) && (status.equals("APPROVED") || status.equals("COMPLETED")))
			db.update("update assets set status=?,is_active=false where asset_id=? and company_id=?", "DISPOSED", assetId, companyId);
		else if ("asset-transfer".equals(type) && status.equals("APPROVED"))
			db.update("update assets set status=? where asset_id=? and company_id=?", "ASSIGNED", assetId, companyId);
		else if ("asset-request".equals(type) && status.equals("APPROVED"))
			db.update("update assets set status=? where asset_id=? and company_id=?", "RESERVED", assetId, companyId);
	}

	@Transactional
	public Map<String, Object> importAssets(Long companyId, Long actorId, List<Map<String, Object>> rows) {
		int accepted = 0; List<Map<String, Object>> rejected = new ArrayList<>();
		for (int i = 0; i < rows.size(); i++) {
			Map<String, Object> row = rows.get(i);
			if (row.get("assetName") == null || row.get("assetTag") == null || row.get("serialNumber") == null) {
				rejected.add(Map.of("row", i + 1, "reason", "assetName, assetTag and serialNumber are required")); continue;
			}
			try { create("asset", companyId, actorId, row); accepted++; }
			catch (Exception ex) { rejected.add(Map.of("row", i + 1, "reason", ex.getMessage() == null ? "Invalid asset" : ex.getMessage())); }
		}
		return Map.of("accepted", accepted, "rejected", rejected, "total", rows.size());
	}

	private void ensureOwned(String type, Long companyId, Long id) {
		String table = table(type), key = key(type);
		Integer count = db.queryForObject("select count(*) from " + table + " where " + key + "=? and company_id=?",
				Integer.class, id, companyId);
		if (count == null || count == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
		}
	}

	private String table(String type) {
		return switch (type) {
		case "asset" -> "assets";
		case "category" -> "asset_categories";
		case "vendor" -> "vendors";
		case "purchase-order" -> "purchase_orders";
		case "invoice" -> "invoices";
		case "maintenance" -> "service_tickets";
		case "asset-allocation" -> "asset_allocations";
		case "asset-request" -> "asset_requests";
		case "asset-transfer" -> "asset_transfers";
		case "asset-return" -> "asset_returns";
		case "asset-disposal" -> "asset_disposals";
		case "repair-history" -> "repair_history";
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		};
	}

	private String key(String type) {
		return switch (type) {
		case "asset" -> "asset_id";
		case "category" -> "category_id";
		case "vendor" -> "vendor_id";
		case "purchase-order" -> "purchase_order_id";
		case "invoice" -> "invoice_id";
		case "maintenance" -> "ticket_id";
		case "asset-allocation" -> "allocation_id";
		case "asset-request" -> "request_id";
		case "asset-transfer" -> "transfer_id";
		case "asset-return" -> "return_id";
		case "asset-disposal" -> "disposal_id";
		case "repair-history" -> "repair_id";
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		};
	}
}
