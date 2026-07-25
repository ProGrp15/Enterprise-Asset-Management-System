package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RegisterCompanyRequest;
import com.example.demo.model.Company;
import com.example.demo.model.User;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.UserRepository;

@Service
public class AuthService {

	@Autowired
	CompanyRepository companyRepository;

	@Autowired
	UserRepository userRepository;

	@Autowired
	JwtUtil jwtUtil;

	public String registerCompany(RegisterCompanyRequest request) {

		Company company = new Company();

		company.setCompanyName(request.getCompanyName());
		company.setIndustry(request.getIndustry());
		company.setCompanySize(request.getCompanySize());
		company.setOfficialEmail(request.getOfficialEmail());
		company.setMobileNumber(request.getMobileNumber());

		companyRepository.save(company);

		User admin = new User();

		admin.setCompanyId(company.getCompanyId());
		admin.setFullName(request.getAdminName());
		admin.setEmail(request.getOfficialEmail());
		admin.setPassword(request.getPassword());
		admin.setRole(User.Role.COMPANY_ADMIN);

		userRepository.save(admin);

		return "Company Registered Successfully";
	}

	public LoginResponse login(LoginRequest request) {

		User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

		if (!user.getPassword().equals(request.getPassword()))
			throw new RuntimeException("Invalid Password");

		String token = jwtUtil.generateToken(user.getEmail());

		return new LoginResponse(token, user.getRole().name(), user.getFullName());
	}

}