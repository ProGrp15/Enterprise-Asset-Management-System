package com.assetflow.company.controller;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
@RestControllerAdvice public class GlobalExceptionHandler {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);
  @ExceptionHandler(ResponseStatusException.class) ResponseEntity<Map<String,Object>> status(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).body(Map.of("success",false,"message",e.getReason()==null?"Request failed":e.getReason()));}
  @ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<Map<String,Object>> conflict(DataIntegrityViolationException e){log.warn("Data integrity conflict: {}", e.getMostSpecificCause()==null?"unique or relationship constraint":e.getMostSpecificCause().getMessage());return ResponseEntity.status(409).body(Map.of("success",false,"message","A record with the same unique value already exists or a relationship is invalid."));}
  @ExceptionHandler(Exception.class) ResponseEntity<Map<String,Object>> generic(Exception e){log.error("Unhandled company-service request failure", e);return ResponseEntity.internalServerError().body(Map.of("success",false,"message","The request could not be completed."));}
}
