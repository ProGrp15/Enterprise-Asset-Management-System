package com.assetflow.asset.service;

import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssetDataService {
  private final JdbcTemplate db;
  public AssetDataService(JdbcTemplate db) { this.db = db; }

  public List<Map<String,Object>> list(String type, Long company, Long user, String role, String search, int page, int size) {
    page = Math.max(0, page);
    size = Math.min(Math.max(1, size), 100);
    String sql = baseQuery(type);
    List<Object> args = new ArrayList<>(List.of(company));

    if ("EMPLOYEE".equals(role)) {
      if ("asset".equals(type)) {
        sql += " and a.asset_id in (select asset_id from asset_allocations where company_id=? and employee_id=? and allocation_status='ACTIVE')";
        args.add(company);
        args.add(user);
      } else if ("category".equals(type)) {
        // Employees may browse categories to submit a request.
      } else if ("asset-request".equals(type)) {
        sql += " and ar.employee_id=?";
        args.add(user);
      } else if ("asset-return".equals(type)) {
        sql += " and ar.employee_id=?";
        args.add(user);
      } else if ("maintenance".equals(type)) {
        sql += " and m.employee_id=?";
        args.add(user);
      } else {
        throw forbidden();
      }
    }

    if (search != null && !search.isBlank()) {
      String filter = searchFilter(type);
      sql += " and (" + filter + ")";
      long questionMarks = filter.chars().filter(c -> c == '?').count();
      for (int i = 0; i < questionMarks; i++) {
        args.add("%" + search + "%");
      }
    }

    sql += " order by " + qualifiedKey(type) + " desc limit ? offset ?";
    args.add(size);
    args.add(page * size);

    return db.queryForList(sql, args.toArray());
  }

  public Map<String,Object> one(String type, Long company, Long user, String role, Long id) {
    ensureOwned(type, company, id);
    if ("EMPLOYEE".equals(role)) {
      if ("asset".equals(type)) {
        ensureAssigned(company, user, id);
      } else if (!Set.of("asset-request", "asset-return", "maintenance").contains(type)) {
        throw forbidden();
      } else {
        ensureEmployeeRecord(type, company, user, id);
      }
    }
    String sql = baseQuery(type) + " and " + qualifiedKey(type) + "=?";
    return db.queryForMap(sql, company, id);
  }

  public void ensureEmployeeAsset(Long company, Long employee, Object asset) {
    if (asset == null) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "An assigned asset is required");
    ensureAssigned(company, employee, Long.valueOf(String.valueOf(asset)));
  }

  private void ensureAssigned(Long company, Long employee, Long asset) {
    Integer n = db.queryForObject("select count(*) from asset_allocations where company_id=? and asset_id=? and employee_id=? and allocation_status='ACTIVE'", Integer.class, company, asset, employee);
    if (n == null || n == 0) throw forbidden();
  }

  private void ensureEmployeeRecord(String type, Long company, Long employee, Long id) {
    Integer n = db.queryForObject("select count(*) from " + table(type) + " where " + key(type) + "=? and company_id=? and employee_id=?", Integer.class, id, company, employee);
    if (n == null || n == 0) throw forbidden();
  }

  @Transactional
  public Map<String,Object> create(String type, Long company, Long actor, Map<String,Object> b) {
    validate(type, company, b);
    switch (type) {
      case "asset" -> {
        Object poId = b.get("purchaseOrderId") != null ? b.get("purchaseOrderId") : (b.get("poId") != null ? b.get("poId") : b.get("purchase_order_id"));
        Object catId = b.get("categoryId") != null ? b.get("categoryId") : b.get("category_id");
        Object venId = b.get("vendorId") != null ? b.get("vendorId") : b.get("vendor_id");
        Object locId = b.get("locationId") != null ? b.get("locationId") : b.get("location_id");
        Object name = b.get("assetName") != null ? b.get("assetName") : b.get("asset_name");
        Object tag = b.get("assetTag") != null ? b.get("assetTag") : b.get("asset_tag");
        Object serial = b.get("serialNumber") != null ? b.get("serialNumber") : b.get("serial_number");
        Object purDate = b.get("purchaseDate") != null ? b.get("purchaseDate") : (b.get("purchase_date") != null ? b.get("purchase_date") : LocalDate.now().toString());
        Object purCost = b.get("purchaseCost") != null ? b.get("purchaseCost") : (b.get("purchase_cost") != null ? b.get("purchase_cost") : 0.0);
        Object warExp = b.get("warrantyExpiry") != null ? b.get("warrantyExpiry") : b.get("warranty_expiry");
        db.update("insert into assets(company_id,category_id,vendor_id,location_id,purchase_order_id,asset_name,asset_tag,serial_number,manufacturer,model,purchase_date,purchase_cost,warranty_expiry,status,remarks) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          company, catId, venId, locId, poId, name, tag, serial, b.get("manufacturer"), b.get("model"), purDate, purCost, warExp, b.getOrDefault("status","AVAILABLE"), b.get("remarks"));
      }
      case "category" -> {
        Object catName = b.get("categoryName") != null ? b.get("categoryName") : b.get("category_name");
        db.update("insert into asset_categories(company_id,category_name,description) values(?,?,?)",
          company, catName, b.get("description"));
      }
      case "vendor" -> {
        Object venName = b.get("vendorName") != null ? b.get("vendorName") : b.get("vendor_name");
        Object cp = b.get("contactPerson") != null ? b.get("contactPerson") : b.get("contact_person");
        db.update("insert into vendors(company_id,vendor_name,contact_person,email,phone,address) values(?,?,?,?,?,?)",
          company, venName, cp, b.get("email"), b.get("phone"), b.get("address"));
      }
      case "purchase-order" -> {
        Object venId = b.get("vendorId") != null ? b.get("vendorId") : b.get("vendor_id");
        Object orderNo = b.get("orderNumber") != null ? b.get("orderNumber") : (b.get("poNumber") != null ? b.get("poNumber") : b.get("order_number"));
        if (orderNo == null || String.valueOf(orderNo).isBlank()) {
          orderNo = "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        Object orderDate = b.get("orderDate") != null ? b.get("orderDate") : (b.get("order_date") != null ? b.get("order_date") : LocalDate.now().toString());
        Object delDate = b.get("expectedDeliveryDate") != null ? b.get("expectedDeliveryDate") : b.get("expected_delivery_date");
        Object amount = b.get("totalAmount") != null ? b.get("totalAmount") : (b.get("total_amount") != null ? b.get("total_amount") : 0.0);
        db.update("insert into purchase_orders(company_id,vendor_id,order_number,order_date,expected_delivery_date,total_amount,status,remarks) values(?,?,?,?,?,?,?,?)",
          company, venId, orderNo, orderDate, delDate, amount, b.getOrDefault("status","DRAFT"), b.get("remarks"));
      }
      case "maintenance" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : b.get("asset_id");
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : (b.get("reportedBy") != null ? b.get("reportedBy") : (b.get("reported_by") != null ? b.get("reported_by") : actor)));
        Object desc = b.get("issueDescription") != null ? b.get("issueDescription") : (b.get("issue_description") != null ? b.get("issue_description") : (b.get("description") != null ? b.get("description") : "Maintenance Issue"));
        db.update("insert into maintenance(company_id,asset_id,employee_id,issue_description,priority,status) values(?,?,?,?,?,?)",
          company, assetId, empId, desc, b.getOrDefault("priority","MEDIUM"), b.getOrDefault("status","OPEN"));
      }
      case "asset-allocation" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : b.get("asset_id");
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : actor);
        Object allocBy = b.get("allocatedBy") != null ? b.get("allocatedBy") : (b.get("allocated_by") != null ? b.get("allocated_by") : actor);
        Object allocDate = b.get("allocatedDate") != null ? b.get("allocatedDate") : (b.get("allocated_date") != null ? b.get("allocated_date") : LocalDate.now().toString());
        Object expDate = b.get("expectedReturnDate") != null ? b.get("expectedReturnDate") : b.get("expected_return_date");
        Object allocStatus = b.get("allocationStatus") != null ? b.get("allocationStatus") : (b.get("allocation_status") != null ? b.get("allocation_status") : b.getOrDefault("status", "ACTIVE"));
        db.update("insert into asset_allocations(company_id,asset_id,employee_id,allocated_by,allocated_date,expected_return_date,allocation_status,remarks) values(?,?,?,?,?,?,?,?)",
          company, assetId, empId, allocBy, allocDate, expDate, allocStatus, b.get("remarks"));
      }
      case "asset-request" -> {
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : (b.get("requestedBy") != null ? b.get("requestedBy") : actor));
        Object catId = b.get("categoryId") != null ? b.get("categoryId") : b.get("category_id");
        Object assetId = b.get("assetId") != null ? b.get("assetId") : b.get("asset_id");
        Object appBy = b.get("approvedBy") != null ? b.get("approvedBy") : b.get("approved_by");
        Object reqType = b.get("requestType") != null ? b.get("requestType") : (b.get("request_type") != null ? b.get("request_type") : "NEW_ASSET");
        db.update("insert into asset_requests(company_id,employee_id,category_id,asset_id,approved_by,request_type,reason,status) values(?,?,?,?,?,?,?,?)",
          company, empId, catId, assetId, appBy, reqType, b.get("reason"), b.getOrDefault("status","PENDING"));
      }
      case "asset-transfer" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : b.get("asset_id");
        Object fromEmp = b.get("fromEmployeeId") != null ? b.get("fromEmployeeId") : b.get("from_employee_id");
        Object toEmp = b.get("toEmployeeId") != null ? b.get("toEmployeeId") : b.get("to_employee_id");
        Object fromLoc = b.get("fromLocationId") != null ? b.get("fromLocationId") : b.get("from_location_id");
        Object toLoc = b.get("toLocationId") != null ? b.get("toLocationId") : b.get("to_location_id");
        Object reqBy = b.get("requestedBy") != null ? b.get("requestedBy") : (b.get("requested_by") != null ? b.get("requested_by") : actor);
        db.update("insert into asset_transfers(company_id,asset_id,from_employee_id,to_employee_id,from_location_id,to_location_id,requested_by,status,reason) values(?,?,?,?,?,?,?,?,?)",
          company, assetId, fromEmp, toEmp, fromLoc, toLoc, reqBy, b.getOrDefault("status","PENDING"), b.get("reason"));
      }
      case "asset-return" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : b.get("asset_id");
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : actor);
        Object reqBy = b.get("requestedBy") != null ? b.get("requestedBy") : (b.get("requested_by") != null ? b.get("requested_by") : actor);
        Object cond = b.get("conditionStatus") != null ? b.get("conditionStatus") : (b.get("condition_status") != null ? b.get("condition_status") : "GOOD");
        db.update("insert into asset_returns(company_id,asset_id,employee_id,requested_by,condition_status,remarks,status) values(?,?,?,?,?,?,?)",
          company, assetId, empId, reqBy, cond, b.get("remarks"), b.getOrDefault("status","PENDING"));
      }
      case "repair-history" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : b.get("asset_id");
        Object techId = b.get("technicianId") != null ? b.get("technicianId") : (b.get("technician_id") != null ? b.get("technician_id") : actor);
        Object desc = b.get("issueDescription") != null ? b.get("issueDescription") : (b.get("issue_description") != null ? b.get("issue_description") : "Repair");
        Object action = b.get("repairAction") != null ? b.get("repairAction") : (b.get("repair_action") != null ? b.get("repair_action") : "Diagnostic & Repair");
        Object cost = b.get("cost") != null ? b.get("cost") : (b.get("repairCost") != null ? b.get("repairCost") : 0.0);
        Object start = b.get("startedAt") != null ? b.get("startedAt") : (b.get("started_at") != null ? b.get("started_at") : LocalDate.now().toString());
        Object comp = b.get("completedAt") != null ? b.get("completedAt") : b.get("completed_at");
        db.update("insert into repair_history(company_id,asset_id,technician_id,issue_description,repair_action,cost,started_at,completed_at,status) values(?,?,?,?,?,?,?,?,?)",
          company, assetId, techId, desc, action, cost, start, comp, b.getOrDefault("status","OPEN"));
      }
      default -> throw bad();
    }
    lifecycle(type, company, actor, b);
    audit(company, actor, type, "CREATE", "Created " + type);
    notifyCreation(type, company, actor, b);
    Long newId = db.queryForObject("select " + key(type) + " from " + table(type) + " where company_id=? order by " + key(type) + " desc limit 1", Long.class, company);
    return one(type, company, actor, "COMPANY_ADMIN", newId);
  }

  @Transactional
  public Map<String,Object> update(String type, Long company, Long actor, Long id, Map<String,Object> b) {
    ensureOwned(type, company, id);
    Map<String,Object> cur = one(type, company, actor, "COMPANY_ADMIN", id);
    Map<String,Object> merged = new HashMap<>(cur);
    if (b != null) {
      merged.putAll(b);
    }
    switch (type) {
      case "asset" -> {
        Object catId = b.get("categoryId") != null ? b.get("categoryId") : (b.get("category_id") != null ? b.get("category_id") : cur.get("category_id"));
        Object venId = b.get("vendorId") != null ? b.get("vendorId") : (b.get("vendor_id") != null ? b.get("vendor_id") : cur.get("vendor_id"));
        Object locId = b.get("locationId") != null ? b.get("locationId") : (b.get("location_id") != null ? b.get("location_id") : cur.get("location_id"));
        Object poId = b.get("purchaseOrderId") != null ? b.get("purchaseOrderId") : (b.get("poId") != null ? b.get("poId") : (b.get("purchase_order_id") != null ? b.get("purchase_order_id") : cur.get("purchase_order_id")));
        Object name = b.get("assetName") != null ? b.get("assetName") : (b.get("asset_name") != null ? b.get("asset_name") : cur.get("asset_name"));
        Object tag = b.get("assetTag") != null ? b.get("assetTag") : (b.get("asset_tag") != null ? b.get("asset_tag") : cur.get("asset_tag"));
        Object serial = b.get("serialNumber") != null ? b.get("serialNumber") : (b.get("serial_number") != null ? b.get("serial_number") : cur.get("serial_number"));
        Object mfg = b.get("manufacturer") != null ? b.get("manufacturer") : cur.get("manufacturer");
        Object model = b.get("model") != null ? b.get("model") : cur.get("model");
        Object purDate = b.get("purchaseDate") != null ? b.get("purchaseDate") : (b.get("purchase_date") != null ? b.get("purchase_date") : cur.get("purchase_date"));
        Object purCost = b.get("purchaseCost") != null ? b.get("purchaseCost") : (b.get("purchase_cost") != null ? b.get("purchase_cost") : cur.get("purchase_cost"));
        Object warExp = b.get("warrantyExpiry") != null ? b.get("warrantyExpiry") : (b.get("warranty_expiry") != null ? b.get("warranty_expiry") : cur.get("warranty_expiry"));
        Object status = b.get("status") != null ? b.get("status") : cur.getOrDefault("status", "AVAILABLE");
        Object remarks = b.get("remarks") != null ? b.get("remarks") : cur.get("remarks");
        db.update("update assets set category_id=?,vendor_id=?,location_id=?,purchase_order_id=?,asset_name=?,asset_tag=?,serial_number=?,manufacturer=?,model=?,purchase_date=?,purchase_cost=?,warranty_expiry=?,status=?,remarks=? where asset_id=? and company_id=?",
          catId, venId, locId, poId, name, tag, serial, mfg, model, purDate, purCost, warExp, status, remarks, id, company);
      }
      case "category" -> {
        Object catName = b.get("categoryName") != null ? b.get("categoryName") : (b.get("category_name") != null ? b.get("category_name") : cur.get("category_name"));
        Object desc = b.get("description") != null ? b.get("description") : cur.get("description");
        Object active = b.get("isActive") != null ? b.get("isActive") : (b.get("is_active") != null ? b.get("is_active") : cur.getOrDefault("is_active", true));
        db.update("update asset_categories set category_name=?,description=?,is_active=? where category_id=? and company_id=?",
          catName, desc, active, id, company);
      }
      case "vendor" -> {
        Object venName = b.get("vendorName") != null ? b.get("vendorName") : (b.get("vendor_name") != null ? b.get("vendor_name") : cur.get("vendor_name"));
        Object cp = b.get("contactPerson") != null ? b.get("contactPerson") : (b.get("contact_person") != null ? b.get("contact_person") : cur.get("contact_person"));
        Object email = b.get("email") != null ? b.get("email") : cur.get("email");
        Object phone = b.get("phone") != null ? b.get("phone") : cur.get("phone");
        Object address = b.get("address") != null ? b.get("address") : cur.get("address");
        Object active = b.get("isActive") != null ? b.get("isActive") : (b.get("is_active") != null ? b.get("is_active") : cur.getOrDefault("is_active", true));
        db.update("update vendors set vendor_name=?,contact_person=?,email=?,phone=?,address=?,is_active=? where vendor_id=? and company_id=?",
          venName, cp, email, phone, address, active, id, company);
      }
      case "purchase-order" -> {
        Object venId = b.get("vendorId") != null ? b.get("vendorId") : (b.get("vendor_id") != null ? b.get("vendor_id") : cur.get("vendor_id"));
        Object orderNo = b.get("orderNumber") != null ? b.get("orderNumber") : (b.get("poNumber") != null ? b.get("poNumber") : (b.get("order_number") != null ? b.get("order_number") : cur.get("order_number")));
        Object orderDate = b.get("orderDate") != null ? b.get("orderDate") : (b.get("order_date") != null ? b.get("order_date") : (cur.get("order_date") != null ? cur.get("order_date") : LocalDate.now().toString()));
        Object delDate = b.get("expectedDeliveryDate") != null ? b.get("expectedDeliveryDate") : (b.get("expected_delivery_date") != null ? b.get("expected_delivery_date") : cur.get("expected_delivery_date"));
        Object amount = b.get("totalAmount") != null ? b.get("totalAmount") : (b.get("total_amount") != null ? b.get("total_amount") : cur.getOrDefault("total_amount", 0.0));
        Object status = b.get("status") != null ? b.get("status") : cur.getOrDefault("status", "DRAFT");
        Object remarks = b.get("remarks") != null ? b.get("remarks") : cur.get("remarks");
        db.update("update purchase_orders set vendor_id=?,order_number=?,order_date=?,expected_delivery_date=?,total_amount=?,status=?,remarks=? where purchase_order_id=? and company_id=?",
          venId, orderNo, orderDate, delDate, amount, status, remarks, id, company);
      }
      case "maintenance" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : (b.get("asset_id") != null ? b.get("asset_id") : cur.get("asset_id"));
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : (cur.get("reported_by") != null ? cur.get("reported_by") : (cur.get("employee_id") != null ? cur.get("employee_id") : actor)));
        Object desc = b.get("issueDescription") != null ? b.get("issueDescription") : (b.get("issue_description") != null ? b.get("issue_description") : cur.get("issue_description"));
        Object priority = b.get("priority") != null ? b.get("priority") : cur.getOrDefault("priority", "MEDIUM");
        Object status = b.get("status") != null ? b.get("status") : cur.getOrDefault("status", "OPEN");
        Object resAt = b.get("resolvedAt") != null ? b.get("resolvedAt") : (b.get("resolved_at") != null ? b.get("resolved_at") : cur.get("resolved_at"));
        db.update("update maintenance set asset_id=?,employee_id=?,issue_description=?,priority=?,status=?,resolved_at=? where maintenance_id=? and company_id=?",
          assetId, empId, desc, priority, status, resAt, id, company);
      }
      case "asset-allocation" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : (b.get("asset_id") != null ? b.get("asset_id") : cur.get("asset_id"));
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : cur.get("employee_id"));
        Object allocBy = b.get("allocatedBy") != null ? b.get("allocatedBy") : (b.get("allocated_by") != null ? b.get("allocated_by") : cur.get("allocated_by"));
        Object allocDate = b.get("allocatedDate") != null ? b.get("allocatedDate") : (b.get("allocated_date") != null ? b.get("allocated_date") : (cur.get("allocated_date") != null ? cur.get("allocated_date") : LocalDate.now().toString()));
        Object expDate = b.get("expectedReturnDate") != null ? b.get("expectedReturnDate") : (b.get("expected_return_date") != null ? b.get("expected_return_date") : cur.get("expected_return_date"));
        Object retDate = b.get("returnedDate") != null ? b.get("returnedDate") : (b.get("returned_date") != null ? b.get("returned_date") : cur.get("returned_date"));
        Object allocStatus = b.get("allocationStatus") != null ? b.get("allocationStatus") : (b.get("allocation_status") != null ? b.get("allocation_status") : (b.get("status") != null ? b.get("status") : cur.getOrDefault("allocation_status", "ACTIVE")));
        Object remarks = b.get("remarks") != null ? b.get("remarks") : cur.get("remarks");
        db.update("update asset_allocations set asset_id=?,employee_id=?,allocated_by=?,allocated_date=?,expected_return_date=?,returned_date=?,allocation_status=?,remarks=? where allocation_id=? and company_id=?",
          assetId, empId, allocBy, allocDate, expDate, retDate, allocStatus, remarks, id, company);
      }
      case "asset-request" -> {
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : cur.get("employee_id"));
        Object catId = b.get("categoryId") != null ? b.get("categoryId") : (b.get("category_id") != null ? b.get("category_id") : cur.get("category_id"));
        Object assetId = b.get("assetId") != null ? b.get("assetId") : (b.get("asset_id") != null ? b.get("asset_id") : cur.get("asset_id"));
        Object appBy = b.get("approvedBy") != null ? b.get("approvedBy") : (b.get("approved_by") != null ? b.get("approved_by") : cur.get("approved_by"));
        Object reqType = b.get("requestType") != null ? b.get("requestType") : (b.get("request_type") != null ? b.get("request_type") : cur.getOrDefault("request_type", "NEW_ASSET"));
        Object reason = b.get("reason") != null ? b.get("reason") : cur.get("reason");
        Object status = b.get("status") != null ? b.get("status") : cur.getOrDefault("status", "PENDING");
        db.update("update asset_requests set employee_id=?,category_id=?,asset_id=?,approved_by=?,request_type=?,reason=?,status=? where request_id=? and company_id=?",
          empId, catId, assetId, appBy, reqType, reason, status, id, company);
      }
      case "asset-transfer" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : (b.get("asset_id") != null ? b.get("asset_id") : cur.get("asset_id"));
        Object fromEmp = b.get("fromEmployeeId") != null ? b.get("fromEmployeeId") : (b.get("from_employee_id") != null ? b.get("from_employee_id") : cur.get("from_employee_id"));
        Object toEmp = b.get("toEmployeeId") != null ? b.get("toEmployeeId") : (b.get("to_employee_id") != null ? b.get("to_employee_id") : cur.get("to_employee_id"));
        Object fromLoc = b.get("fromLocationId") != null ? b.get("fromLocationId") : (b.get("from_location_id") != null ? b.get("from_location_id") : cur.get("from_location_id"));
        Object toLoc = b.get("toLocationId") != null ? b.get("toLocationId") : (b.get("to_location_id") != null ? b.get("to_location_id") : cur.get("to_location_id"));
        Object appBy = b.get("approvedBy") != null ? b.get("approvedBy") : (b.get("approved_by") != null ? b.get("approved_by") : cur.get("approved_by"));
        Object status = b.get("status") != null ? b.get("status") : cur.getOrDefault("status", "PENDING");
        Object reason = b.get("reason") != null ? b.get("reason") : cur.get("reason");
        db.update("update asset_transfers set asset_id=?,from_employee_id=?,to_employee_id=?,from_location_id=?,to_location_id=?,approved_by=?,status=?,reason=? where transfer_id=? and company_id=?",
          assetId, fromEmp, toEmp, fromLoc, toLoc, appBy, status, reason, id, company);
      }
      case "asset-return" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : (b.get("asset_id") != null ? b.get("asset_id") : cur.get("asset_id"));
        Object empId = b.get("employeeId") != null ? b.get("employeeId") : (b.get("employee_id") != null ? b.get("employee_id") : cur.get("employee_id"));
        Object appBy = b.get("approvedBy") != null ? b.get("approvedBy") : (b.get("approved_by") != null ? b.get("approved_by") : cur.get("approved_by"));
        Object cond = b.get("conditionStatus") != null ? b.get("conditionStatus") : (b.get("condition_status") != null ? b.get("condition_status") : cur.getOrDefault("condition_status", "GOOD"));
        Object remarks = b.get("remarks") != null ? b.get("remarks") : cur.get("remarks");
        Object status = b.get("status") != null ? b.get("status") : cur.getOrDefault("status", "PENDING");
        Object retAt = b.get("returnedAt") != null ? b.get("returnedAt") : (b.get("returned_at") != null ? b.get("returned_at") : cur.get("returned_at"));
        db.update("update asset_returns set asset_id=?,employee_id=?,approved_by=?,condition_status=?,remarks=?,status=?,returned_at=? where return_id=? and company_id=?",
          assetId, empId, appBy, cond, remarks, status, retAt, id, company);
      }
      case "repair-history" -> {
        Object assetId = b.get("assetId") != null ? b.get("assetId") : (b.get("asset_id") != null ? b.get("asset_id") : cur.get("asset_id"));
        Object techId = b.get("technicianId") != null ? b.get("technicianId") : (b.get("technician_id") != null ? b.get("technician_id") : cur.get("technician_id"));
        Object desc = b.get("issueDescription") != null ? b.get("issueDescription") : (b.get("issue_description") != null ? b.get("issue_description") : cur.get("issue_description"));
        Object action = b.get("repairAction") != null ? b.get("repairAction") : (b.get("repair_action") != null ? b.get("repair_action") : cur.get("repair_action"));
        Object cost = b.get("cost") != null ? b.get("cost") : (b.get("repairCost") != null ? b.get("repairCost") : cur.getOrDefault("cost", 0.0));
        Object start = b.get("startedAt") != null ? b.get("startedAt") : (b.get("started_at") != null ? b.get("started_at") : cur.get("started_at"));
        Object comp = b.get("completedAt") != null ? b.get("completedAt") : (b.get("completed_at") != null ? b.get("completed_at") : cur.get("completed_at"));
        Object status = b.get("status") != null ? b.get("status") : cur.getOrDefault("status", "OPEN");
        db.update("update repair_history set asset_id=?,technician_id=?,issue_description=?,repair_action=?,cost=?,started_at=?,completed_at=?,status=? where repair_id=? and company_id=?",
          assetId, techId, desc, action, cost, start, comp, status, id, company);
      }
      default -> throw bad();
    }
    merged.putIfAbsent("assetId", cur.get("asset_id"));
    merged.putIfAbsent("employeeId", cur.get("employee_id"));
    lifecycle(type, company, actor, merged);
    audit(company, actor, type, "UPDATE", "Updated " + type + " #" + id);
    notifyUpdate(type, company, actor, cur, merged);
    return one(type, company, actor, "COMPANY_ADMIN", id);
  }

  @Transactional
  public void delete(String type, Long company, Long actor, Long id) {
    ensureOwned(type, company, id);
    db.update("update " + table(type) + " set is_active=false where " + key(type) + "=? and company_id=?", id, company);
    audit(company, actor, type, "DELETE", "Deactivated " + type + " #" + id);
  }

  @Transactional
  public Map<String,Object> importAssets(Long company, Long actor, List<Map<String,Object>> rows) {
    int ok = 0;
    List<Map<String,Object>> bad = new ArrayList<>();
    for (int i = 0; i < (rows == null ? 0 : rows.size()); i++) {
      try {
        create("asset", company, actor, rows.get(i));
        ok++;
      } catch (Exception e) {
        bad.add(Map.of("row", i + 1, "reason", String.valueOf(e.getMessage())));
      }
    }
    return Map.of("accepted", ok, "rejected", bad, "total", rows == null ? 0 : rows.size());
  }

  private String baseQuery(String type) {
    return switch (type) {
      case "asset" -> "select a.*, c.category_name, v.vendor_name, l.location_name, po.order_number as purchase_order_number from assets a left join asset_categories c on c.category_id=a.category_id left join vendors v on v.vendor_id=a.vendor_id left join locations l on l.location_id=a.location_id left join purchase_orders po on po.purchase_order_id=a.purchase_order_id where a.company_id=? and a.is_active=true";
      case "category" -> "select c.*, (select count(*) from assets a where a.category_id=c.category_id and a.company_id=c.company_id and a.is_active=true) as total_assets from asset_categories c where c.company_id=? and c.is_active=true";
      case "vendor" -> "select v.*, (select count(*) from assets a where a.vendor_id=v.vendor_id and a.company_id=v.company_id and a.is_active=true) as total_assets from vendors v where v.company_id=? and v.is_active=true";
      case "purchase-order" -> "select po.*, v.vendor_name from purchase_orders po left join vendors v on v.vendor_id=po.vendor_id where po.company_id=? and po.is_active=true";
      case "maintenance" -> "select m.*, a.asset_name, a.asset_tag, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email from maintenance m left join assets a on a.asset_id=m.asset_id left join users u on u.user_id=m.employee_id where m.company_id=? and m.is_active=true";
      case "asset-allocation" -> "select aa.*, a.asset_name, a.asset_tag, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email, concat(ab.first_name, ' ', ab.last_name) as allocated_by_name from asset_allocations aa left join assets a on a.asset_id=aa.asset_id left join users u on u.user_id=aa.employee_id left join users ab on ab.user_id=aa.allocated_by where aa.company_id=? and aa.is_active=true";
      case "asset-request" -> "select ar.*, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email, c.category_name, a.asset_name, a.asset_tag, concat(ab.first_name, ' ', ab.last_name) as approved_by_name from asset_requests ar left join users u on u.user_id=ar.employee_id left join asset_categories c on c.category_id=ar.category_id left join assets a on a.asset_id=ar.asset_id left join users ab on ab.user_id=ar.approved_by where ar.company_id=? and ar.is_active=true";
      case "asset-transfer" -> "select at.*, a.asset_name, a.asset_tag, concat(fe.first_name, ' ', fe.last_name) as from_employee_name, concat(te.first_name, ' ', te.last_name) as to_employee_name, fl.location_name as from_location_name, tl.location_name as to_location_name, concat(ab.first_name, ' ', ab.last_name) as approved_by_name from asset_transfers at left join assets a on a.asset_id=at.asset_id left join users fe on fe.user_id=at.from_employee_id left join users te on te.user_id=at.to_employee_id left join locations fl on fl.location_id=at.from_location_id left join locations tl on tl.location_id=at.to_location_id left join users ab on ab.user_id=at.approved_by where at.company_id=? and at.is_active=true";
      case "asset-return" -> "select ar.*, a.asset_name, a.asset_tag, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email, concat(ab.first_name, ' ', ab.last_name) as approved_by_name from asset_returns ar left join assets a on a.asset_id=ar.asset_id left join users u on u.user_id=ar.employee_id left join users ab on ab.user_id=ar.approved_by where ar.company_id=? and ar.is_active=true";
      case "repair-history" -> "select rh.*, a.asset_name, a.asset_tag, concat(t.first_name, ' ', t.last_name) as technician_name from repair_history rh left join assets a on a.asset_id=rh.asset_id left join users t on t.user_id=rh.technician_id where rh.company_id=? and rh.is_active=true";
      default -> throw bad();
    };
  }

  private String searchFilter(String type) {
    return switch (type) {
      case "asset" -> "a.asset_name like ? or a.asset_tag like ? or a.serial_number like ? or a.status like ? or c.category_name like ? or v.vendor_name like ?";
      case "category" -> "c.category_name like ? or c.description like ?";
      case "vendor" -> "v.vendor_name like ? or v.contact_person like ? or v.email like ?";
      case "purchase-order" -> "po.order_number like ? or po.status like ? or v.vendor_name like ?";
      case "maintenance" -> "a.asset_name like ? or m.issue_description like ? or m.status like ? or u.first_name like ? or u.last_name like ?";
      case "asset-allocation" -> "a.asset_name like ? or a.asset_tag like ? or aa.allocation_status like ? or u.first_name like ? or u.last_name like ?";
      case "asset-request" -> "c.category_name like ? or ar.request_type like ? or ar.reason like ? or ar.status like ? or u.first_name like ? or u.last_name like ?";
      case "asset-transfer" -> "a.asset_name like ? or at.status like ? or at.reason like ? or fe.first_name like ? or te.first_name like ?";
      case "asset-return" -> "a.asset_name like ? or ar.condition_status like ? or ar.status like ? or u.first_name like ?";
      case "repair-history" -> "a.asset_name like ? or rh.issue_description like ? or rh.repair_action like ? or rh.status like ?";
      default -> "cast(" + qualifiedKey(type) + " as char) like ?";
    };
  }

  private String qualifiedKey(String t) {
    return switch (t) {
      case "asset" -> "a.asset_id";
      case "category" -> "c.category_id";
      case "vendor" -> "v.vendor_id";
      case "purchase-order" -> "po.purchase_order_id";
      case "maintenance" -> "m.maintenance_id";
      case "asset-allocation" -> "aa.allocation_id";
      case "asset-request" -> "ar.request_id";
      case "asset-transfer" -> "at.transfer_id";
      case "asset-return" -> "ar.return_id";
      case "repair-history" -> "rh.repair_id";
      default -> throw bad();
    };
  }

  private void validate(String type, Long company, Map<String,Object> b) {
    Map<String,String> required = new LinkedHashMap<>();
    if ("asset".equals(type)) {
      required.put("assetName", "Asset name");
      required.put("assetTag", "Asset tag");
      required.put("serialNumber", "Serial number");
      required.put("categoryId", "Category");
      required.put("vendorId", "Vendor");
    }
    if ("category".equals(type)) required.put("categoryName", "Category name");
    if ("vendor".equals(type)) required.put("vendorName", "Vendor name");
    for (var f : required.entrySet()) {
      if (b.get(f.getKey()) == null || String.valueOf(b.get(f.getKey())).isBlank()) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, f.getValue() + " is required");
      }
    }
    Map<String,String> refs = new LinkedHashMap<>();
    switch (type) {
      case "asset" -> {
        refs.put("categoryId", "asset_categories:category_id");
        refs.put("vendorId", "vendors:vendor_id");
        refs.put("locationId", "locations:location_id");
        refs.put("purchaseOrderId", "purchase_orders:purchase_order_id");
        refs.put("poId", "purchase_orders:purchase_order_id");
      }
      case "purchase-order" -> refs.put("vendorId", "vendors:vendor_id");
      case "maintenance" -> {
        refs.put("assetId", "assets:asset_id");
        refs.put("employeeId", "users:user_id");
      }
      case "asset-allocation" -> {
        refs.put("assetId", "assets:asset_id");
        refs.put("employeeId", "users:user_id");
        refs.put("allocatedBy", "users:user_id");
      }
      case "asset-request" -> {
        refs.put("assetId", "assets:asset_id");
        refs.put("categoryId", "asset_categories:category_id");
        refs.put("employeeId", "users:user_id");
        refs.put("approvedBy", "users:user_id");
      }
      case "asset-transfer" -> {
        refs.put("assetId", "assets:asset_id");
        refs.put("fromEmployeeId", "users:user_id");
        refs.put("toEmployeeId", "users:user_id");
        refs.put("fromLocationId", "locations:location_id");
        refs.put("toLocationId", "locations:location_id");
      }
      case "asset-return" -> {
        refs.put("assetId", "assets:asset_id");
        refs.put("employeeId", "users:user_id");
      }
      case "repair-history" -> {
        refs.put("assetId", "assets:asset_id");
        refs.put("technicianId", "users:user_id");
      }
      default -> {}
    }
    for (var f : refs.entrySet()) {
      Object id = b.get(f.getKey());
      if (id == null || String.valueOf(id).isBlank()) continue;
      String[] t = f.getValue().split(":");
      Integer n = db.queryForObject("select count(*) from " + t[0] + " where " + t[1] + "=? and company_id=?", Integer.class, id, company);
      if (n == null || n == 0) {
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Referenced " + f.getKey() + " does not belong to this company");
      }
    }
  }

  private void lifecycle(String type, Long company, Long actor, Map<String,Object> b) {
    Object a = b.get("assetId");
    if (a == null) return;
    String s = String.valueOf(b.getOrDefault("status", "")).toUpperCase();
    if ("asset-allocation".equals(type) && !"CANCELLED".equals(s)) {
      db.update("update assets set status='ASSIGNED' where asset_id=? and company_id=?", a, company);
    } else if ("asset-return".equals(type) && Set.of("APPROVED", "COMPLETED").contains(s)) {
      db.update("update assets set status='AVAILABLE' where asset_id=? and company_id=?", a, company);
      db.update("update asset_allocations set allocation_status='RETURNED',returned_date=coalesce(returned_date,current_date) where company_id=? and asset_id=? and employee_id=? and allocation_status='ACTIVE'", company, a, b.get("employeeId"));
    } else if ("asset-transfer".equals(type) && "APPROVED".equals(s)) {
      db.update("update assets set status='ASSIGNED' where asset_id=? and company_id=?", a, company);
      db.update("update asset_allocations set allocation_status='TRANSFERRED',returned_date=coalesce(returned_date,current_date) where company_id=? and asset_id=? and allocation_status='ACTIVE'", company, a);
      Object to = b.get("toEmployeeId");
      if (to != null) {
        db.update("insert into asset_allocations(company_id,asset_id,employee_id,allocated_by,allocated_date,allocation_status,remarks) values(?,?,?,?,current_date,'ACTIVE','Transferred')", company, a, to, actor);
      }
    } else if ("asset-request".equals(type) && "APPROVED".equals(s)) {
      db.update("update assets set status='ASSIGNED' where asset_id=? and company_id=?", a, company);
      Integer active = db.queryForObject("select count(*) from asset_allocations where company_id=? and asset_id=? and allocation_status='ACTIVE'", Integer.class, company, a);
      if (active == null || active == 0) {
        db.update("insert into asset_allocations(company_id,asset_id,employee_id,allocated_by,allocated_date,allocation_status,remarks) values(?,?,?,?,current_date,'ACTIVE','Approved request')", company, a, b.get("employeeId"), b.getOrDefault("approvedBy", actor));
      }
    } else if ("maintenance".equals(type)) {
      db.update("update assets set status=? where asset_id=? and company_id=?", Set.of("COMPLETED", "CANCELLED").contains(s) ? "AVAILABLE" : "UNDER_REPAIR", a, company);
    }
  }

  /** Called when a record is first created. For asset-request, notifies all company admins. */
  private void notifyCreation(String type, Long company, Long actor, Map<String,Object> b) {
    if (!"asset-request".equals(type)) {
      // Generic employee notification for other creation types
      Object u = switch (type) {
        case "asset-allocation", "maintenance" -> b.get("employeeId");
        case "asset-transfer" -> b.get("toEmployeeId");
        default -> null;
      };
      if (u != null) {
        try {
          db.update("insert into notifications(company_id,user_id,title,message) values(?,?,?,?)",
              company, u, "AssetFlow update", "You have been assigned to a " + type.replace('-', ' ') + ".");
        } catch (Exception ignored) {}
      }
      return;
    }
    // Asset request created: notify all COMPANY_ADMIN users in this company
    try {
      String employeeName = "An employee";
      try {
        Map<String,Object> empRow = db.queryForMap(
            "select concat(first_name,' ',last_name) as n from users where user_id=? and company_id=?", actor, company);
        if (empRow.get("n") != null) employeeName = String.valueOf(empRow.get("n"));
      } catch (Exception ignored) {}
      String reqType = String.valueOf(b.getOrDefault("requestType", b.getOrDefault("request_type", "NEW ASSET")));
      String reason  = String.valueOf(b.getOrDefault("reason", "No reason provided"));
      String msg = employeeName + " submitted an asset request — Type: " + reqType.replace('_', ' ')
                 + ". Reason: " + (reason.length() > 120 ? reason.substring(0, 120) + "…" : reason);
      List<Map<String,Object>> admins = db.queryForList(
          "select u.user_id from users u join roles r on r.role_id=u.role_id "
          + "where u.company_id=? and r.role_name='COMPANY_ADMIN' and u.is_active=true", company);
      for (Map<String,Object> admin : admins) {
        db.update("insert into notifications(company_id,user_id,title,message) values(?,?,?,?)",
            company, admin.get("user_id"), "New Asset Request", msg);
      }
    } catch (Exception ignored) {}
  }

  /** Called when a record is updated. For asset-request status changes, notifies the employee. */
  private void notifyUpdate(String type, Long company, Long actor, Map<String,Object> cur, Map<String,Object> merged) {
    if ("asset-request".equals(type)) {
      String prevStatus = String.valueOf(cur.getOrDefault("status", "PENDING")).toUpperCase();
      String newStatus  = String.valueOf(merged.getOrDefault("status", "PENDING")).toUpperCase();
      Object empId      = merged.getOrDefault("employeeId", cur.get("employee_id"));
      if (empId != null && !prevStatus.equals(newStatus)
          && ("APPROVED".equals(newStatus) || "REJECTED".equals(newStatus) || "FULFILLED".equals(newStatus))) {
        String title = "Asset Request " + newStatus.charAt(0) + newStatus.substring(1).toLowerCase();
        String body  = "Your asset request has been " + newStatus.toLowerCase() + " by your administrator.";
        if ("APPROVED".equals(newStatus))  body = "Great news! Your asset request has been approved by your administrator.";
        if ("FULFILLED".equals(newStatus)) body = "Your asset request has been fulfilled and the asset has been allocated to you.";
        try {
          db.update("insert into notifications(company_id,user_id,title,message) values(?,?,?,?)",
              company, empId, title, body);
        } catch (Exception ignored) {}
      }
      return;
    }
    // Generic update notification for other types
    Object u = switch (type) {
      case "asset-allocation", "asset-return", "maintenance" -> merged.get("employeeId");
      case "asset-transfer" -> merged.get("toEmployeeId");
      default -> null;
    };
    if (u != null) {
      try {
        db.update("insert into notifications(company_id,user_id,title,message) values(?,?,?,?)",
            company, u, "AssetFlow update", "Your " + type.replace('-', ' ') + " status has been updated.");
      } catch (Exception ignored) {}
    }
  }

  private void audit(Long company, Long actor, String module, String action, String text) {
    try {
      db.update("insert into audit_logs(company_id,user_id,module,action,description) values(?,?,?,?,?)", company, actor, module, action, text);
    } catch (Exception ignored) {}
  }

  private void ensureOwned(String type, Long company, Long id) {
    Integer n = db.queryForObject("select count(*) from " + table(type) + " where " + key(type) + "=? and company_id=?", Integer.class, id, company);
    if (n == null || n == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
  }

  private String table(String t) {
    return switch (t) {
      case "asset" -> "assets";
      case "category" -> "asset_categories";
      case "vendor" -> "vendors";
      case "purchase-order" -> "purchase_orders";
      case "maintenance" -> "maintenance";
      case "asset-allocation" -> "asset_allocations";
      case "asset-request" -> "asset_requests";
      case "asset-transfer" -> "asset_transfers";
      case "asset-return" -> "asset_returns";
      case "repair-history" -> "repair_history";
      default -> throw bad();
    };
  }

  private String key(String t) {
    return switch (t) {
      case "asset" -> "asset_id";
      case "category" -> "category_id";
      case "vendor" -> "vendor_id";
      case "purchase-order" -> "purchase_order_id";
      case "maintenance" -> "maintenance_id";
      case "asset-allocation" -> "allocation_id";
      case "asset-request" -> "request_id";
      case "asset-transfer" -> "transfer_id";
      case "asset-return" -> "return_id";
      case "repair-history" -> "repair_id";
      default -> throw bad();
    };
  }

  private ResponseStatusException bad() {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resource");
  }

  private ResponseStatusException forbidden() {
    return new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this resource");
  }
}
