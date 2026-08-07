package com.assetflow.auth;

import com.assetflow.auth.dto.AuthDtos.*;
import com.assetflow.auth.entity.Role;
import com.assetflow.auth.entity.User;
import com.assetflow.auth.repository.RoleRepository;
import com.assetflow.auth.repository.UserRepository;
import com.assetflow.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "eureka.client.enabled=false",
    "eureka.client.register-with-eureka=false",
    "eureka.client.fetch-registry=false",
    "app.seed.superadmin-password=ChangeThisLocalSuperAdminPassword!"
})
class AuthAndPlatformWorkflowIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        Role superAdminRole = roleRepository.findByName("SUPER_ADMIN").orElseGet(() -> {
            Role r = new Role();
            r.setName("SUPER_ADMIN");
            return roleRepository.save(r);
        });

        User superAdmin = userRepository.findByEmail("superadmin@assetflow.in").orElseGet(() -> {
            User u = new User();
            u.setEmail("superadmin@assetflow.in");
            u.setFirstName("Super");
            u.setLastName("Admin");
            u.setPhone("9999999999");
            return u;
        });

        superAdmin.setCompany(null);
        superAdmin.setRole(superAdminRole);
        superAdmin.setActive(true);
        superAdmin.setPassword(passwordEncoder.encode("ChangeThisLocalSuperAdminPassword!"));
        userRepository.save(superAdmin);
    }

    @Test
    @DisplayName("Phases 1-3: Platform Super Admin Login, Company Registration, and Company Admin Login")
    void testAuthAndCompanyRegistrationWorkflow() {
        // --- PHASE 1: Super Admin Login ---
        Login superAdminLogin = new Login("superadmin@assetflow.in", "ChangeThisLocalSuperAdminPassword!");

        AuthView superAdminView = authService.login(superAdminLogin);
        assertNotNull(superAdminView);
        assertNotNull(superAdminView.accessToken());
        assertEquals("SUPER_ADMIN", superAdminView.user().role());

        // --- PHASE 2: Company Registration ---
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6);
        String companyEmail = "admin." + randomSuffix + "@innovatecorp.com";

        RegisterCompany registerPayload = new RegisterCompany(
                "Innovate Corp " + randomSuffix,
                companyEmail,
                "9876543210",
                "IT Services",
                "10-50",
                "Tech Park Blvd",
                "Pune",
                "Maharashtra",
                "India",
                "411057",
                "Admin Innovate",
                "CompanyAdminPass123!"
        );

        AuthView registeredView = authService.register(registerPayload);
        assertNotNull(registeredView);
        assertNotNull(registeredView.accessToken());
        assertEquals("COMPANY_ADMIN", registeredView.user().role());
        assertNotNull(registeredView.company().id());

        // --- PHASE 3: Company Admin Login ---
        Login companyAdminLogin = new Login(companyEmail, "CompanyAdminPass123!");

        AuthView loggedInView = authService.login(companyAdminLogin);
        assertNotNull(loggedInView);
        assertEquals(companyEmail, loggedInView.user().email());
        assertEquals("COMPANY_ADMIN", loggedInView.user().role());
        assertEquals(registeredView.company().id(), loggedInView.company().id());

        // Profile Lookup
        AuthView profile = authService.profile(loggedInView.user().email());
        assertNotNull(profile);
        assertEquals("Admin Innovate", profile.user().name());
    }
}
