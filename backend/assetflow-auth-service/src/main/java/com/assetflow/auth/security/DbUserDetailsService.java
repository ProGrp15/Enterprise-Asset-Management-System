package com.assetflow.auth.security;

import com.assetflow.auth.repository.UserRepository;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class DbUserDetailsService implements UserDetailsService {
	private final UserRepository users;

	public DbUserDetailsService(UserRepository users) {
		this.users = users;
	}

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		var user = users.findByEmail(username)
				.orElseThrow(() -> new UsernameNotFoundException("Account not found"));
		return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(),
				Boolean.TRUE.equals(user.getActive()), true, true, true,
				List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName())));
	}
}
