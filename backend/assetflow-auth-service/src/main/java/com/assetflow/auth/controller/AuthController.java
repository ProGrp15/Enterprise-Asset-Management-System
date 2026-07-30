package com.assetflow.auth.controller;

import com.assetflow.auth.dto.AuthDtos.*;
import com.assetflow.auth.response.ApiResponse;
import com.assetflow.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService service;

	public AuthController(AuthService s) {
		service = s;
	}

	@PostMapping("/register-company")
	public ApiResponse<AuthView> register(@Valid @RequestBody RegisterCompany body) {
		return ApiResponse.ok(service.register(body));
	}

	@PostMapping("/login")
	public ApiResponse<AuthView> login(@Valid @RequestBody Login body) {
		return ApiResponse.ok(service.login(body));
	}

	@PostMapping("/forgot-password")
	public ApiResponse<String> forgot(@Valid @RequestBody Forgot body) {
		String token = service.forgot(body);
		return ApiResponse.ok(token);
	}

	@PostMapping("/reset-password")
	public ApiResponse<Void> reset(@Valid @RequestBody Reset body) {
		service.reset(body);
		return ApiResponse.message("Password reset successfully.");
	}

	@PostMapping("/refresh-token")
	public ApiResponse<AuthView> refresh(@Valid @RequestBody Refresh body) {
		return ApiResponse.ok(service.refresh(body));
	}

	@GetMapping("/profile")
	public ApiResponse<AuthView> profile(Authentication auth) {
		return ApiResponse.ok(service.profile(auth.getName()));
	}
}
