package com.assetflow.asset.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
public class SecurityConfig {
	/** Asset operations use the shared JWT filter; disable Spring's generated in-memory credentials. */
	@Bean AuthenticationManager authenticationManager() { return authentication -> { throw new org.springframework.security.authentication.BadCredentialsException("Bearer JWT authentication is required"); }; }
	@Bean
	JwtFilter jwtFilter(@Value("${app.jwt.secret}") String secret) {
		return new JwtFilter(secret);
	}

	@Bean
	SecurityFilterChain filter(HttpSecurity http, JwtFilter filter) throws Exception {
		return http.csrf(csrf -> csrf.disable()).cors(cors -> cors.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(a -> a.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/health/**")
						.permitAll().anyRequest().authenticated())
				.addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class).build();
	}

	static class JwtFilter extends OncePerRequestFilter {
		private final SecretKey key;

		JwtFilter(String secret) {
			try { this.key = Keys.hmacShaKeyFor(MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { throw new IllegalStateException("Unable to initialize JWT key", e); }
		}

		@Override
		protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
				throws ServletException, IOException {
			String header = request.getHeader("Authorization");
			if (header != null && header.startsWith("Bearer ")) {
				try {
					Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(header.substring(7)).getPayload();
					if ("access".equals(claims.get("type"))) {
						var auth = new UsernamePasswordAuthenticationToken(claims, null,
								java.util.List.of(new SimpleGrantedAuthority("ROLE_" + claims.get("role", String.class))));
						SecurityContextHolder.getContext().setAuthentication(auth);
					}
				} catch (Exception ignored) {
				}
			}
			chain.doFilter(request, response);
		}
	}
}
