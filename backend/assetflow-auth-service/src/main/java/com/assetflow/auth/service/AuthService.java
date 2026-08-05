package com.assetflow.auth.service;

import com.assetflow.auth.dto.AuthDtos.*;
import com.assetflow.auth.entity.*;
import com.assetflow.auth.repository.*;
import com.assetflow.auth.security.JwtService;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

@Service
public class AuthService {
	private final CompanyRepository companies;
	private final UserRepository users;
	private final RoleRepository roles;
	private final PasswordResetTokenRepository resetTokens;
	private final AuthenticationManager authenticationManager;
	private final PasswordEncoder encoder;
	private final JwtService jwt;
	private final JdbcTemplate db;
	private final PasswordEmailService passwordEmail;

	public AuthService(CompanyRepository c, UserRepository u, PasswordResetTokenRepository resetTokens,
			RoleRepository roles, AuthenticationManager authenticationManager, PasswordEncoder e, JwtService j, JdbcTemplate db, PasswordEmailService passwordEmail) {
		companies = c;
		users = u;
		this.roles = roles;
		this.resetTokens = resetTokens;
		this.authenticationManager = authenticationManager;
		encoder = e;
			jwt = j;
			this.db = db;
			this.passwordEmail = passwordEmail;
	}

	@Transactional
	public AuthView register(RegisterCompany r) {
		if (companies.existsByEmail(r.officialEmail()) || users.existsByEmail(r.officialEmail()))
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Company or account email already exists");
		Company c = new Company();
		c.setName(r.companyName());
		c.setEmail(r.officialEmail());
		c.setPhone(r.mobileNumber());
		c.setIndustry(r.industry());
		c.setOrganizationSize(r.companySize());
		c.setAddress(r.address());
		c.setCity(r.city());
		c.setState(r.state());
		c.setCountry(r.country());
		c.setPostalCode(r.postalCode());
		companies.save(c);
		Role role = roles.findByName("COMPANY_ADMIN")
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "COMPANY_ADMIN role is missing"));
		String[] name = r.adminName().trim().split("\\s+", 2);
		User u = new User();
		u.setCompany(c);
		u.setFirstName(name[0]);
		u.setLastName(name.length > 1 ? name[1] : "");
		u.setEmail(r.officialEmail());
		u.setPhone(r.mobileNumber());
		u.setRole(role);
		u.setPassword(encoder.encode(r.password()));
		users.save(u);
		return view(u);
	}

	public AuthView login(Login r) {
		try {
			authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(r.email(), r.password()));
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		User u = users.findByEmail(r.email())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
		if (!Boolean.TRUE.equals(u.getActive()) || (u.getCompany() != null && !Boolean.TRUE.equals(u.getCompany().getActive())))
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		return view(u);
	}

	@Transactional
	public String forgot(Forgot r) {
		return users.findByEmail(r.email()).map(u -> {
			PasswordResetToken token = new PasswordResetToken();
			token.setUser(u);
			String raw = UUID.randomUUID().toString().replace("-", "");
			token.setTokenHash(hash(raw));
			token.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
			resetTokens.save(token);
			passwordEmail.send(u.getEmail(), raw);
			return raw;
		}).orElse(null);
	}

	@Transactional
	public void reset(Reset r) {
		PasswordResetToken token = resetTokens.findByTokenHash(hash(r.token()))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));
		if (token.getConsumedAt() != null || token.getExpiresAt().isBefore(Instant.now()))
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
		User u = token.getUser();
		u.setPassword(encoder.encode(r.password()));
		users.save(u);
		token.setConsumedAt(Instant.now());
		resetTokens.save(token);
	}

	public AuthView refresh(Refresh r) {
		Map<String, Object> c;
		try {
			c = jwt.parse(r.refreshToken());
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
		}
		if (!"refresh".equals(c.get("type")))
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
		return view(users.findById(Long.valueOf(String.valueOf(c.get("sub"))))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found")));
	}

	public AuthView profile(String email) {
		return view(users.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found")));
	}

	@Transactional
	public void changePassword(String email, ChangePassword request) {
		User user = users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
		if (!encoder.matches(request.currentPassword(), user.getPassword()))
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
		user.setPassword(encoder.encode(request.newPassword()));
		users.save(user);
	}

	private AuthView view(User u) {
		Company c = u.getCompany();
		String role = u.getRole().getName();
		List<String> permissions = List.of();
		Long companyId = c == null ? null : c.getId();
		return new AuthView(jwt.issue(u.getId(), companyId, role, u.getEmail(), false, permissions),
				jwt.issue(u.getId(), companyId, role, u.getEmail(), true, permissions),
				new UserView(u.getId(), u.getFirstName() + " " + u.getLastName(), u.getEmail(), role,
						u.getDepartment() != null ? u.getDepartment().getName() : null),
				c == null ? null : new CompanyView(c.getId(), c.getName(), c.getEmail()), List.of("workspace:read"));
	}

	private String hash(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] encoded = digest.digest(token.getBytes(StandardCharsets.UTF_8));
			StringBuilder builder = new StringBuilder();
			for (byte b : encoded) {
				builder.append(String.format("%02x", b));
			}
			return builder.toString();
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate reset token");
		}
	}
}
