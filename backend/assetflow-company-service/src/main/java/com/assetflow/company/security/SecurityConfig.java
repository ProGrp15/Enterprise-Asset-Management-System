package com.assetflow.company.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
	@Bean
	JwtFilter jwtFilter(@Value("${app.jwt.secret}") String secret) {
		return new JwtFilter(secret);
	}

	@Bean
	SecurityFilterChain chain(HttpSecurity h, JwtFilter f) throws Exception {
		return h.csrf(csrf -> csrf.disable()).cors(cors -> cors.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(a -> a.requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/health")
						.permitAll().anyRequest().authenticated())
				.addFilterBefore(f, UsernamePasswordAuthenticationFilter.class).build();
	}

	static class JwtFilter extends OncePerRequestFilter {
		final SecretKey key;

		JwtFilter(String s) {
			key = Keys.hmacShaKeyFor(s.getBytes(StandardCharsets.UTF_8));
		}

		protected void doFilterInternal(HttpServletRequest r, HttpServletResponse p, FilterChain c)
				throws ServletException, IOException {
			String h = r.getHeader("Authorization");
			if (h != null && h.startsWith("Bearer "))
				try {
					Claims x = Jwts.parser().verifyWith(key).build().parseSignedClaims(h.substring(7)).getPayload();
					if ("access".equals(x.get("type"))) {
						var a = new UsernamePasswordAuthenticationToken(x, null,
								java.util.List.of(new SimpleGrantedAuthority("ROLE_" + x.get("role", String.class))));
						SecurityContextHolder.getContext().setAuthentication(a);
					}
				} catch (Exception ignored) {
				}
			c.doFilter(r, p);
		}
	}
}
