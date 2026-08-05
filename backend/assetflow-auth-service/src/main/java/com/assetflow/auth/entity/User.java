package com.assetflow.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "user_id")
	private Long id;
	@ManyToOne
	@JoinColumn(name = "company_id")
	private Company company;
	@ManyToOne
	@JoinColumn(name = "department_id")
	private Department department;
	@ManyToOne
	@JoinColumn(name = "role_id")
	private Role role;
	@Column(name = "first_name")
	private String firstName;
	@Column(name = "last_name")
	private String lastName;
	private String email, password, phone;
	@Column(name = "is_active")
	private Boolean active = true;
}
