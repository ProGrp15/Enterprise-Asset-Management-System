package com.assetflow.auth.repository;

import com.assetflow.auth.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
	boolean existsByEmail(String email);
	java.util.Optional<Company> findByEmail(String email);
}
