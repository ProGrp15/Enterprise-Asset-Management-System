package com.assetflow.notification.response;
import java.time.Instant;
public record ApiResponse<T>(boolean success,T data,String message,Instant timestamp){ public static <T> ApiResponse<T> ok(T d){return new ApiResponse<>(true,d,null,Instant.now());} public static <T> ApiResponse<T> error(String m){return new ApiResponse<>(false,null,m,Instant.now());}}
