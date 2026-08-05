package com.assetflow.notification.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationEmailService {
  private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private static final Logger log = LoggerFactory.getLogger(NotificationEmailService.class);
  private final JavaMailSender sender;
  private final String host;
  private final int port;
  private final String username;
  private final String password;

  public NotificationEmailService(JavaMailSender sender,
      @Value("${spring.mail.host:}") String host,
      @Value("${spring.mail.port:587}") int port,
      @Value("${spring.mail.username:}") String username,
      @Value("${spring.mail.password:}") String password) {
    this.sender = sender;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }

  public Map<String, Object> status() {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("configured", configured());
    result.put("hostConfigured", !host.isBlank());
    result.put("port", port);
    result.put("usernameConfigured", !username.isBlank());
    result.put("passwordConfigured", !password.isBlank());
    return result;
  }

  public Map<String, Object> send(String to, String subject, String body) {
    Map<String, Object> result = new LinkedHashMap<>(status());
    if (!configured()) {
      result.put("sent", false);
      result.put("message", "SMTP is not configured. Set MAIL_HOST, MAIL_USERNAME, and MAIL_PASSWORD.");
      return result;
    }
    if (to == null || !EMAIL.matcher(to).matches()) {
      result.put("sent", false);
      result.put("message", "A valid recipient email is required.");
      return result;
    }
    try {
      SimpleMailMessage message = new SimpleMailMessage();
      message.setFrom(username);
      message.setTo(to);
      message.setSubject(subject == null || subject.isBlank() ? "AssetFlow notification" : subject);
      message.setText(body == null ? "" : body);
      sender.send(message);
      result.put("sent", true);
      result.put("message", "Email accepted by the SMTP server.");
    } catch (RuntimeException ex) {
      log.warn("SMTP delivery failed host={} port={} recipient={} reason={}", host, port, mask(to), ex.getMessage());
      result.put("sent", false);
      result.put("message", "SMTP delivery failed. Check the host, credentials, TLS mode, and recipient.");
    }
    return result;
  }

  private boolean configured() {
    return !host.isBlank() && !username.isBlank() && !password.isBlank();
  }

  private String mask(String address) {
    if (address == null || address.isBlank()) return "unknown";
    int at = address.indexOf('@');
    return at <= 1 ? "***" : address.charAt(0) + "***" + address.substring(at);
  }
}
