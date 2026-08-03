package com.assetflow.auth.dto;

import jakarta.validation.constraints.*;
import java.util.*;

public final class AuthDtos {
	private AuthDtos() {
	}

	public record RegisterCompany(@NotBlank String companyName, @Email String officialEmail,
			@NotBlank String mobileNumber, @NotBlank String industry, @NotBlank String companySize,
			@NotBlank String address, @NotBlank String city, @NotBlank String state, @NotBlank String country,
			@NotBlank String postalCode, @NotBlank String adminName, @Size(min = 8) String password) {
	}

	public record Login(@Email String email, @NotBlank String password) {
	}

	public record Forgot(@Email String email) {
	}

	public record Reset(@NotBlank String token, @Size(min = 8) String password) {
	}

	public record Refresh(@NotBlank String refreshToken) {
	}

	public record UserView(Long id, String name, String email, String role, String department) {
	}

	public record CompanyView(Long id, String name, String email) {
	}

	public record AuthView(String accessToken, String refreshToken, UserView user, CompanyView company,
			List<String> permissions) {
	}
}
