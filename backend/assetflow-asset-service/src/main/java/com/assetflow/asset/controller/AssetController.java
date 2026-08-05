package com.assetflow.asset.controller;

import com.assetflow.asset.response.ApiResponse;
import com.assetflow.asset.service.AssetDataService;
import io.jsonwebtoken.Claims;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

@RestController
public class AssetController {
	private final AssetDataService service;

	public AssetController(AssetDataService service) {
		this.service = service;
	}

	private Long company(Authentication authentication) {
		return ((Claims) authentication.getPrincipal()).get("companyId", Long.class);
	}
	private Long user(Authentication authentication) {
		Object subject = ((Claims) authentication.getPrincipal()).getSubject();
		return Long.valueOf(String.valueOf(subject));
	}
	private void assertWriteAccess(String type, Authentication auth) {
		Claims claims = (Claims) auth.getPrincipal();
		String role = claims.get("role", String.class);
		if ("COMPANY_ADMIN".equals(role) || "SUPER_ADMIN".equals(role)) return;
		if ("EMPLOYEE".equals(role) && Set.of("asset-request", "asset-return", "maintenance").contains(type)) return;
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to modify this resource");
	}

	@GetMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history}")
	public ApiResponse<List<Map<String, Object>>> list(@PathVariable String type, @RequestParam(required = false) String search,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size, Authentication auth) {
		Claims claims = (Claims) auth.getPrincipal();
		return ApiResponse.ok(service.list(type, company(auth), user(auth), claims.get("role", String.class), search, page, size));
	}

	@GetMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history}/{id}")
	public ApiResponse<Map<String, Object>> one(@PathVariable String type, @PathVariable Long id, Authentication auth) {
		Claims claims = (Claims) auth.getPrincipal();
		return ApiResponse.ok(service.one(type, company(auth), user(auth), claims.get("role", String.class), id));
	}

	@PostMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history}")
	public ApiResponse<Map<String, Object>> create(@PathVariable String type, @RequestBody Map<String, Object> body,
			Authentication auth) {
		assertWriteAccess(type, auth);
		Claims claims = (Claims) auth.getPrincipal();
		if ("EMPLOYEE".equals(claims.get("role", String.class))) {
			if ("asset-request".equals(type) || "asset-return".equals(type) || "maintenance".equals(type)) {
				body.put("employeeId", user(auth)); body.put("requestedBy", user(auth));
				if ("asset-return".equals(type) || "maintenance".equals(type)) service.ensureEmployeeAsset(company(auth), user(auth), body.get("assetId"));
			}
		}
		if ("asset-allocation".equals(type)) body.putIfAbsent("allocatedBy", user(auth));
		if ("asset-transfer".equals(type) || "asset-return".equals(type)) body.putIfAbsent("requestedBy", user(auth));
		return ApiResponse.ok(service.create(type, company(auth), user(auth), body));
	}

	@PostMapping("/asset/import")
	public ApiResponse<Map<String, Object>> importAssets(@RequestBody List<Map<String, Object>> rows, Authentication auth) {
		assertWriteAccess("asset", auth);
		return ApiResponse.ok(service.importAssets(company(auth), user(auth), rows));
	}

	@PutMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history}/{id}")
	public ApiResponse<Map<String, Object>> update(@PathVariable String type, @PathVariable Long id,
			@RequestBody Map<String, Object> body, Authentication auth) {
		assertWriteAccess(type, auth);
		Claims claims = (Claims) auth.getPrincipal();
		if ("EMPLOYEE".equals(claims.get("role", String.class))) { body.put("employeeId", user(auth)); if ("asset-return".equals(type) || "maintenance".equals(type)) service.ensureEmployeeAsset(company(auth), user(auth), body.get("assetId")); }
		if ("asset-request".equals(type) && "APPROVED".equalsIgnoreCase(String.valueOf(body.getOrDefault("status", "")))) body.putIfAbsent("approvedBy", user(auth));
		if ("asset-return".equals(type) && "APPROVED".equalsIgnoreCase(String.valueOf(body.getOrDefault("status", "")))) body.putIfAbsent("approvedBy", user(auth));
		if ("asset-transfer".equals(type) && "APPROVED".equalsIgnoreCase(String.valueOf(body.getOrDefault("status", "")))) body.putIfAbsent("approvedBy", user(auth));
		return ApiResponse.ok(service.update(type, company(auth), user(auth), id, body));
	}

	@DeleteMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|repair-history}/{id}")
	public ApiResponse<Void> delete(@PathVariable String type, @PathVariable Long id, Authentication auth) {
		assertWriteAccess(type, auth);
		service.delete(type, company(auth), user(auth), id);
		return ApiResponse.message("Deleted successfully");
	}
}
