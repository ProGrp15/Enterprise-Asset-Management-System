package com.assetflow.asset.service;

import java.util.ArrayList;
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

	public List<Map<String, Object>> list(String type, Long companyId) {
		return db.queryForList("select * from " + table(type) + " where company_id=? order by 1 desc", companyId);
	}

	public Map<String, Object> one(String type, Long companyId, Long id) {
		ensureOwned(type, companyId, id);
		return db.queryForMap("select * from " + table(type) + " where " + key(type) + "=?", id);
	}

	@Transactional
	public Map<String, Object> create(String type, Long companyId, Map<String, Object> body) {
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
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		}
		return body;
	}

	@Transactional
	public Map<String, Object> update(String type, Long companyId, Long id, Map<String, Object> body) {
		ensureOwned(type, companyId, id);
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
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		}
		return body;
	}

	@Transactional
	public void delete(String type, Long companyId, Long id) {
		ensureOwned(type, companyId, id);
		if ("purchase-order".equals(type)) {
			db.update("delete from purchase_orders where purchase_order_id=?", id);
			return;
		}
		String table = table(type), key = key(type);
		db.update("delete from " + table + " where " + key + "=?", id);
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
		case "maintenance" -> "service_tickets";
		case "asset-allocation" -> "asset_allocations";
		case "asset-request" -> "asset_requests";
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		};
	}

	private String key(String type) {
		return switch (type) {
		case "asset" -> "asset_id";
		case "category" -> "category_id";
		case "vendor" -> "vendor_id";
		case "purchase-order" -> "purchase_order_id";
		case "maintenance" -> "ticket_id";
		case "asset-allocation" -> "allocation_id";
		case "asset-request" -> "request_id";
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
		};
	}
}
