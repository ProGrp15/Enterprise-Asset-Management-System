package com.example.demo.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    AuthService authService;

    @PostMapping("/register-company")
    public String registerCompany(@RequestBody RegisterCompanyRequest request){

        return authService.registerCompany(request);

    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request){

        return authService.login(request);

    }

}