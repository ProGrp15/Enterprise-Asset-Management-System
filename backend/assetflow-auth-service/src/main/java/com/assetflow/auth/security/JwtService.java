package com.assetflow.auth.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.Key;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Collection;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
	private static final String HMAC_ALG = "HmacSHA256";
	private final Key key;
	private final long accessMinutes;
	private final long refreshDays;
	private final ObjectMapper mapper = new ObjectMapper();

	public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.access-minutes}") long access,
			@Value("${app.jwt.refresh-days}") long refresh) {
		try { this.key = new SecretKeySpec(MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8)), HMAC_ALG); } catch (Exception e) { throw new IllegalStateException("Unable to initialize JWT key", e); }
		this.accessMinutes = access;
		this.refreshDays = refresh;
	}

	public String issue(Long userId, Long companyId, String role, String email, boolean refresh) {
		return issue(userId, companyId, role, email, refresh, java.util.List.of());
	}

	public String issue(Long userId, Long companyId, String role, String email, boolean refresh, Collection<String> permissions) {
		Map<String, Object> claims = new LinkedHashMap<>();
		claims.put("sub", String.valueOf(userId));
		claims.put("companyId", companyId);
		claims.put("role", role);
		claims.put("email", email);
		claims.put("permissions", permissions == null ? java.util.List.of() : permissions);
		claims.put("type", refresh ? "refresh" : "access");
		claims.put("iat", Instant.now().getEpochSecond());
		claims.put("exp", Instant.now().plusSeconds((refresh ? refreshDays * 24 * 60 : accessMinutes) * 60).getEpochSecond());
		try {
			String header = base64Url(mapper.writeValueAsBytes(Map.of("alg", "HS256", "typ", "JWT")));
			String payload = base64Url(mapper.writeValueAsBytes(claims));
			String signature = sign(header + "." + payload);
			return header + "." + payload + "." + signature;
		} catch (Exception e) {
			throw new IllegalStateException("Unable to issue token", e);
		}
	}

	public Map<String, Object> parse(String token) {
		try {
			String[] parts = token.split("\\.");
			if (parts.length != 3)
				throw new IllegalArgumentException("Invalid token");
			String expected = sign(parts[0] + "." + parts[1]);
			if (!constantTimeEquals(expected, parts[2]))
				throw new IllegalArgumentException("Invalid token signature");
			Map<String, Object> claims = mapper.readValue(Base64.getUrlDecoder().decode(parts[1]),
					new TypeReference<Map<String, Object>>() {
					});
			Object exp = claims.get("exp");
			if (exp != null && Instant.now().getEpochSecond() > Long.parseLong(String.valueOf(exp)))
				throw new IllegalArgumentException("Token expired");
			return claims;
		} catch (Exception e) {
			throw new IllegalArgumentException("Invalid token", e);
		}
	}

	private String sign(String value) throws Exception {
		Mac mac = Mac.getInstance(HMAC_ALG);
		mac.init(key);
		return base64Url(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
	}

	private String base64Url(byte[] bytes) {
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private boolean constantTimeEquals(String a, String b) {
		byte[] aa = a.getBytes(StandardCharsets.UTF_8);
		byte[] bb = b.getBytes(StandardCharsets.UTF_8);
		if (aa.length != bb.length)
			return false;
		int result = 0;
		for (int i = 0; i < aa.length; i++)
			result |= aa[i] ^ bb[i];
		return result == 0;
	}
}
