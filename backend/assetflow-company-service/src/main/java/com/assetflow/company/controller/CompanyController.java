package com.assetflow.company.controller;

import com.assetflow.company.response.ApiResponse;
import com.assetflow.company.service.CompanyDataService;
import io.jsonwebtoken.Claims;
import java.util.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class CompanyController {
	private final CompanyDataService service;

	public CompanyController(CompanyDataService s) {
		service = s;
	}

	private Long company(Authentication a) {
		return ((Claims) a.getPrincipal()).get("companyId", Long.class);
	}
	private Long user(Authentication a) {
		return Long.valueOf(((Claims) a.getPrincipal()).getSubject());
	}
	private String role(Authentication a) {
		return ((Claims) a.getPrincipal()).get("role", String.class);
	}
	private void assertAdmin(Authentication a) {
		String role = ((Claims) a.getPrincipal()).get("role", String.class);
		if (!"SUPER_ADMIN".equals(role) && !"COMPANY_ADMIN".equals(role))
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access is required");
	}

	@GetMapping("/api/{type:department|employee|admin|location}")
	public ApiResponse<List<Map<String, Object>>> list(@PathVariable String type,
			@RequestParam(required = false) String search, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size, Authentication a) {
		return ApiResponse.ok(service.list(type, company(a), user(a), role(a), search, page, size));
	}

	@GetMapping("/api/{type:department|employee|admin|location}/{id}")
	public ApiResponse<Map<String, Object>> one(@PathVariable String type, @PathVariable Long id, Authentication a) {
		return ApiResponse.ok(service.one(type, company(a), user(a), role(a), id));
	}

	@PostMapping("/api/{type:department|employee|admin|location}")
	public ApiResponse<Map<String, Object>> create(@PathVariable String type, @RequestBody Map<String, Object> b,
			Authentication a) {
		assertAdmin(a);
		return ApiResponse.ok(service.create(type, company(a), user(a), b));
	}
	@PostMapping("/api/employee/import")
	public ApiResponse<Map<String, Object>> importEmployees(@RequestBody List<Map<String, Object>> rows, Authentication a) {
		assertAdmin(a);
		return ApiResponse.ok(service.importEmployees(company(a), user(a), rows));
	}
	@PutMapping("/api/{type:department|employee|admin|location}/{id}")
	public ApiResponse<Map<String,Object>> update(@PathVariable String type, @PathVariable Long id, @RequestBody Map<String,Object> b, Authentication a) {
		assertAdmin(a);
		return ApiResponse.ok(service.update(type, company(a), user(a), id, b));
	}

	@DeleteMapping("/api/{type:department|employee|admin|location}/{id}")
	public ApiResponse<Void> remove(@PathVariable String type, @PathVariable Long id, Authentication a) {
		assertAdmin(a);
		service.delete(type, company(a), user(a), id);
		return ApiResponse.ok(null);
	}
}
