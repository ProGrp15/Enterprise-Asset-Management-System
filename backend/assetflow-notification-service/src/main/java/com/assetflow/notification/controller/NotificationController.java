package com.assetflow.notification.controller;

import com.assetflow.notification.response.ApiResponse;
import com.assetflow.notification.service.NotificationDataService;
import com.assetflow.notification.service.NotificationEmailService;
import io.jsonwebtoken.Claims;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class NotificationController {
  private final NotificationDataService service;
  private final NotificationEmailService email;

  public NotificationController(NotificationDataService service, NotificationEmailService email) {
    this.service = service;
    this.email = email;
  }

  private Map<String, Object> claims(Authentication authentication) {
    return (Claims) authentication.getPrincipal();
  }

  @PostMapping("/email/send")
  public ApiResponse<?> sendEmail(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(email.send((String) body.get("to"), String.valueOf(body.getOrDefault("subject", "AssetFlow notification")), String.valueOf(body.getOrDefault("body", ""))));
  }
  @GetMapping("/email/status") public ApiResponse<?> emailStatus() { return ApiResponse.ok(email.status()); }

  @GetMapping("/notification") public ApiResponse<?> list(Authentication a) { return ApiResponse.ok(service.notifications(claims(a))); }
  @PostMapping("/notification") public ApiResponse<?> create(@RequestBody Map<String, Object> body, Authentication a) { return ApiResponse.ok(service.createNotification(claims(a), body)); }
  @PutMapping("/notification/read/{id}") public ApiResponse<?> read(@PathVariable long id, Authentication a) { service.read(claims(a), id); return ApiResponse.ok(null); }
  @DeleteMapping("/notification/{id}") public ApiResponse<?> delete(@PathVariable long id, Authentication a) { service.delete(claims(a), id); return ApiResponse.ok(null); }
  @PutMapping("/notification/read-all") public ApiResponse<?> readAll(Authentication a) { service.readAll(claims(a)); return ApiResponse.ok(null); }
  @GetMapping("/audit") public ApiResponse<?> audits(Authentication a) { return ApiResponse.ok(service.audits(claims(a))); }
  @PostMapping("/audit") public ApiResponse<?> audit(@RequestBody Map<String, Object> body, Authentication a) { return ApiResponse.ok(service.audit(claims(a), body)); }
  @GetMapping("/dashboard") public ApiResponse<?> dashboard(Authentication a) { return ApiResponse.ok(service.dashboard(claims(a))); }
  @GetMapping("/report/{type}") public ApiResponse<?> report(@PathVariable String type, Authentication a) { return ApiResponse.ok(service.report(type, claims(a))); }
  @PostMapping("/ai/chat") public ApiResponse<?> chat(@RequestBody Map<String, Object> body, Authentication a) { return ApiResponse.ok(service.chat(body, claims(a))); }
}
