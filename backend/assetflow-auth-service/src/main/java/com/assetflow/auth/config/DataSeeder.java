package com.assetflow.auth.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.assetflow.auth.entity.Company;
import com.assetflow.auth.entity.Role;
import com.assetflow.auth.entity.User;
import com.assetflow.auth.repository.CompanyRepository;
import com.assetflow.auth.repository.RoleRepository;
import com.assetflow.auth.repository.UserRepository;

@Configuration
public class DataSeeder {

	@Bean
	@Transactional
	CommandLineRunner seed(RoleRepository roles, CompanyRepository companies, UserRepository users,
				PasswordEncoder encoder, @Value("${app.seed.superadmin-password:}") String initialPassword) {
		return args -> {
			Role superAdminRole = roles.findByName("SUPER_ADMIN").orElseGet(() -> {
				Role role = new Role();
				role.setName("SUPER_ADMIN");
				return roles.save(role);
			});
			roles.findByName("COMPANY_ADMIN").orElseGet(() -> {
				Role role = new Role();
				role.setName("COMPANY_ADMIN");
				return roles.save(role);
			});
			roles.findByName("EMPLOYEE").orElseGet(() -> {
				Role role = new Role();
				role.setName("EMPLOYEE");
				return roles.save(role);
			});
			User owner = users.findByEmail("superadmin@assetflow.in").orElseGet(() -> {
				if (initialPassword == null || initialPassword.isBlank())
					throw new IllegalStateException("APP_SUPERADMIN_PASSWORD is required when bootstrapping the initial super admin");
				User superAdmin = new User();
				superAdmin.setCompany(null);
				superAdmin.setFirstName("Super");
				superAdmin.setLastName("Admin");
				superAdmin.setEmail("superadmin@assetflow.in");
				superAdmin.setPhone("9999999999");
				superAdmin.setRole(superAdminRole);
				superAdmin.setPassword(encoder.encode(initialPassword));
				return users.save(superAdmin);
			});
			owner.setCompany(null);
			owner.setRole(superAdminRole);
			users.save(owner);
		};
	}
}
