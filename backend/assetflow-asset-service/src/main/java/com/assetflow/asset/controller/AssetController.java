package com.assetflow.asset.controller;

import com.assetflow.asset.response.ApiResponse;
import com.assetflow.asset.service.AssetDataService;
import io.jsonwebtoken.Claims;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
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

	@GetMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request}")
	public ApiResponse<List<Map<String, Object>>> list(@PathVariable String type, Authentication auth) {
		return ApiResponse.ok(service.list(type, company(auth)));
	}

	@GetMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request}/{id}")
	public ApiResponse<Map<String, Object>> one(@PathVariable String type, @PathVariable Long id, Authentication auth) {
		return ApiResponse.ok(service.one(type, company(auth), id));
	}

	@PostMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request}")
	public ApiResponse<Map<String, Object>> create(@PathVariable String type, @RequestBody Map<String, Object> body,
			Authentication auth) {
		return ApiResponse.ok(service.create(type, company(auth), body));
	}

	@PutMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request}/{id}")
	public ApiResponse<Map<String, Object>> update(@PathVariable String type, @PathVariable Long id,
			@RequestBody Map<String, Object> body, Authentication auth) {
		return ApiResponse.ok(service.update(type, company(auth), id, body));
	}

	@DeleteMapping("/{type:asset|category|vendor|purchase-order|maintenance|asset-allocation|asset-request}/{id}")
	public ApiResponse<Void> delete(@PathVariable String type, @PathVariable Long id, Authentication auth) {
		service.delete(type, company(auth), id);
		return ApiResponse.message("Deleted successfully");
	}
}
