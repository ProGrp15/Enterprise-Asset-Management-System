package com.assetflow.company.response;

import java.time.Instant;

public record ApiResponse<T>(boolean success, T data, String message, Instant timestamp) {
	public static <T> ApiResponse<T> ok(T data) {
		return new ApiResponse<>(true, data, null, Instant.now());
	}
}
