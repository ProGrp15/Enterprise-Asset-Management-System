package com.assetflow.company.controller;

import com.assetflow.company.response.ApiResponse;
import com.assetflow.company.service.CompanyDataService;
import io.jsonwebtoken.Claims;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class CompanyController {
	private final CompanyDataService service;

	public CompanyController(CompanyDataService s) {
		service = s;
	}

	private Long company(Authentication a) {
		return ((Claims) a.getPrincipal()).get("companyId", Long.class);
	}

	@GetMapping("/api/{type:department|employee|admin|location}")
	public ApiResponse<List<Map<String, Object>>> list(@PathVariable String type,
			@RequestParam(required = false) String search, Authentication a) {
		return ApiResponse.ok(service.list(type, company(a), search));
	}

	@GetMapping("/api/{type:department|employee|admin|location}/{id}")
	public ApiResponse<Map<String, Object>> one(@PathVariable String type, @PathVariable Long id, Authentication a) {
		return ApiResponse.ok(service.one(type, company(a), id));
	}

	@PostMapping("/api/{type:department|employee|admin|location}")
	public ApiResponse<Map<String, Object>> create(@PathVariable String type, @RequestBody Map<String, Object> b,
			Authentication a) {
		return ApiResponse.ok(service.create(type, company(a), b));
	}
	@PutMapping("/api/{type:department|employee|admin|location}/{id}")
	public ApiResponse<Map<String,Object>> update(@PathVariable String type, @PathVariable Long id, @RequestBody Map<String,Object> b, Authentication a) {
		return ApiResponse.ok(service.update(type, company(a), id, b));
	}

	@DeleteMapping("/api/{type:department|employee|admin|location}/{id}")
	public ApiResponse<Void> remove(@PathVariable String type, @PathVariable Long id, Authentication a) {
		service.delete(type, company(a), id);
		return ApiResponse.ok(null);
	}
}
