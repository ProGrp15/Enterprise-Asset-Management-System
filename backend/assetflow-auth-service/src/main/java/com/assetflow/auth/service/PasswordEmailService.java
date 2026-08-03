package com.assetflow.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class PasswordEmailService {
    private final JavaMailSender sender;
    private final String username;

    public PasswordEmailService(JavaMailSender sender, @Value("${spring.mail.username:}") String username) {
        this.sender = sender;
        this.username = username;
    }

    public boolean send(String recipient, String token) {
        if (username == null || username.isBlank() || recipient == null || recipient.isBlank()) return false;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(username);
            message.setTo(recipient);
            message.setSubject("Reset your AssetFlow password");
            message.setText("Use this one-time reset token within 15 minutes: " + token);
            sender.send(message);
            return true;
        } catch (RuntimeException ignored) {
            return false;
        }
    }
}
