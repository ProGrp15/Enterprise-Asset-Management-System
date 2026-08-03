package com.assetflow.auth.exception;

import com.assetflow.auth.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
	@ExceptionHandler(ResponseStatusException.class)
	ResponseEntity<ApiResponse<Void>> status(ResponseStatusException e) {
		return ResponseEntity.status(e.getStatusCode())
				.body(new ApiResponse<>(false, null, e.getReason(), java.time.Instant.now()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiResponse<Void>> validation(MethodArgumentNotValidException e) {
		String message = e.getBindingResult().getFieldErrors().stream().map(FieldError::getDefaultMessage)
				.filter(m -> m != null && !m.isBlank()).findFirst()
				.orElse("Validation failed");
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ApiResponse<>(false, null, message, java.time.Instant.now()));
	}

	@ExceptionHandler({ ConstraintViolationException.class, DataIntegrityViolationException.class })
	ResponseEntity<ApiResponse<Void>> data(Exception e) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(new ApiResponse<>(false, null, "Request could not be completed", java.time.Instant.now()));
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ApiResponse<Void>> all(Exception e) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiResponse<>(false, null, "An unexpected error occurred", java.time.Instant.now()));
	}
}
