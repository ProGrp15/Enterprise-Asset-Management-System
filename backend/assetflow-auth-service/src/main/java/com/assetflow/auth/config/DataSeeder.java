package com.assetflow.auth.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

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
			PasswordEncoder encoder, JdbcTemplate db) {
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
			seedPermissions(db);

			Company platform = companies.findByEmail("superadmin@assetflow.in").orElseGet(() -> {
				Company company = new Company();
				company.setName("AssetFlow Platform");
				company.setEmail("superadmin@assetflow.in");
				company.setPhone("9999999999");
				company.setIndustry("Technology");
				company.setOrganizationSize("Enterprise");
				company.setAddress("AssetFlow HQ");
				company.setCity("Mumbai");
				company.setState("Maharashtra");
				company.setCountry("India");
				company.setPostalCode("400001");
				return companies.save(company);
			});

			users.findByEmail("superadmin@assetflow.in").orElseGet(() -> {
				User superAdmin = new User();
				superAdmin.setCompany(platform);
				superAdmin.setFirstName("Super");
				superAdmin.setLastName("Admin");
				superAdmin.setEmail("superadmin@assetflow.in");
				superAdmin.setPhone("9999999999");
				superAdmin.setRole(superAdminRole);
				superAdmin.setPassword(encoder.encode("admin123"));
				return users.save(superAdmin);
			});
		};
	}

	private void seedPermissions(JdbcTemplate db) {
		try {
			db.execute("CREATE TABLE IF NOT EXISTS permissions (permission_id BIGINT AUTO_INCREMENT PRIMARY KEY, permission_key VARCHAR(100) NOT NULL UNIQUE, description VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
			db.execute("CREATE TABLE IF NOT EXISTS role_permissions (role_id BIGINT NOT NULL, permission_id BIGINT NOT NULL, PRIMARY KEY(role_id, permission_id))");
			String[][] permissions = {{"ASSET_READ", "View assets"}, {"ASSET_WRITE", "Manage assets"}, {"ASSET_LIFECYCLE", "Dispose and repair assets"}, {"ASSET_REQUEST", "Request an asset"}, {"ASSET_RETURN", "Return an asset"}, {"MAINTENANCE_REQUEST", "Raise maintenance requests"}, {"REPORT_EXPORT", "Export reports"}, {"USER_ADMIN", "Manage users"}};
			for (String[] permission : permissions) db.update("INSERT IGNORE INTO permissions(permission_key,description) VALUES(?,?)", permission[0], permission[1]);
			db.update("INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.role_id,p.permission_id FROM roles r CROSS JOIN permissions p WHERE r.role_name IN ('SUPER_ADMIN','COMPANY_ADMIN')");
			db.update("INSERT IGNORE INTO role_permissions(role_id,permission_id) SELECT r.role_id,p.permission_id FROM roles r JOIN permissions p ON p.permission_key IN ('ASSET_READ','ASSET_REQUEST','ASSET_RETURN','MAINTENANCE_REQUEST') WHERE r.role_name='EMPLOYEE'");
		} catch (RuntimeException ignored) {
			// A database that has not reached the permissions migration remains bootable; the migration can repair it later.
		}
	}
}
