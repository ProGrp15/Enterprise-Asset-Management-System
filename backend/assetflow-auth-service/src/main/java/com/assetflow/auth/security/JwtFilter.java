package com.assetflow.auth.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Map;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {
	private final JwtService jwt;

	public JwtFilter(JwtService jwt) {
		this.jwt = jwt;
	}

	protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
			throws ServletException, IOException {
		String h = req.getHeader("Authorization");
		if (h != null && h.startsWith("Bearer "))
			try {
				Map<String, Object> c = jwt.parse(h.substring(7));
				if ("access".equals(c.get("type"))) {
					var a = new UsernamePasswordAuthenticationToken(String.valueOf(c.get("email")), null,
							java.util.List.of(new SimpleGrantedAuthority("ROLE_" + String.valueOf(c.get("role")))));
					SecurityContextHolder.getContext().setAuthentication(a);
				}
			} catch (Exception ignored) {
			}
		chain.doFilter(req, res);
	}
}
