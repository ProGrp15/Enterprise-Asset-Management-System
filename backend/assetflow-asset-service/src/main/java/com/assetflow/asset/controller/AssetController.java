package com.assetflow.asset.controller;

import com.assetflow.asset.response.ApiResponse;
import com.assetflow.asset.service.AssetDataService;
import io.jsonwebtoken.Claims;
import java.util.List;
import java.util.Map;
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
		if ("SUPER_ADMIN".equals(role)) return;
		String required = switch (type) {
			case "asset-request" -> "ASSET_REQUEST";
			case "asset-return" -> "ASSET_RETURN";
			case "maintenance" -> "MAINTENANCE_REQUEST";
			case "asset-disposal", "repair-history", "asset-transfer", "asset-allocation" -> "ASSET_LIFECYCLE";
			default -> "ASSET_WRITE";
		};
		Object raw = claims.get("permissions");
		boolean claimPresent = raw instanceof java.util.Collection<?>;
		boolean granted = raw instanceof java.util.Collection<?> values
				&& values.stream().map(String::valueOf).anyMatch(required::equals);
		if (granted || (!claimPresent && "COMPANY_ADMIN".equals(role))) return;
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to modify this resource");
	}

	@GetMapping("/{type:asset|category|vendor|purchase-order|invoice|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|asset-disposal|repair-history}")
	public ApiResponse<List<Map<String, Object>>> list(@PathVariable String type, @RequestParam(required = false) String search,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "25") int size, Authentication auth) {
		Claims claims = (Claims) auth.getPrincipal();
		return ApiResponse.ok(service.list(type, company(auth), user(auth), claims.get("role", String.class), search, page, size));
	}

	@GetMapping("/{type:asset|category|vendor|purchase-order|invoice|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|asset-disposal|repair-history}/{id}")
	public ApiResponse<Map<String, Object>> one(@PathVariable String type, @PathVariable Long id, Authentication auth) {
		Claims claims = (Claims) auth.getPrincipal();
		return ApiResponse.ok(service.one(type, company(auth), user(auth), claims.get("role", String.class), id));
	}

	@PostMapping("/{type:asset|category|vendor|purchase-order|invoice|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|asset-disposal|repair-history}")
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
		return ApiResponse.ok(service.create(type, company(auth), user(auth), body));
	}

	@PostMapping("/asset/import")
	public ApiResponse<Map<String, Object>> importAssets(@RequestBody List<Map<String, Object>> rows, Authentication auth) {
		assertWriteAccess("asset", auth);
		return ApiResponse.ok(service.importAssets(company(auth), user(auth), rows));
	}

	@PutMapping("/{type:asset|category|vendor|purchase-order|invoice|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|asset-disposal|repair-history}/{id}")
	public ApiResponse<Map<String, Object>> update(@PathVariable String type, @PathVariable Long id,
			@RequestBody Map<String, Object> body, Authentication auth) {
		assertWriteAccess(type, auth);
		Claims claims = (Claims) auth.getPrincipal();
		if ("EMPLOYEE".equals(claims.get("role", String.class))) { body.put("employeeId", user(auth)); if ("asset-return".equals(type) || "maintenance".equals(type)) service.ensureEmployeeAsset(company(auth), user(auth), body.get("assetId")); }
		return ApiResponse.ok(service.update(type, company(auth), user(auth), id, body));
	}

	@DeleteMapping("/{type:asset|category|vendor|purchase-order|invoice|maintenance|asset-allocation|asset-request|asset-transfer|asset-return|asset-disposal|repair-history}/{id}")
	public ApiResponse<Void> delete(@PathVariable String type, @PathVariable Long id, Authentication auth) {
		assertWriteAccess(type, auth);
		service.delete(type, company(auth), user(auth), id);
		return ApiResponse.message("Deleted successfully");
	}
}
