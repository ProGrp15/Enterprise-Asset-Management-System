package com.assetflow.gateway.config;
import org.springframework.cloud.gateway.route.RouteLocator;import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;import org.springframework.context.annotation.Bean;import org.springframework.context.annotation.Configuration;
@Configuration public class GatewayRoutes { @Bean RouteLocator routes(RouteLocatorBuilder b){return b.routes()
 .route("auth",r->r.path("/api/auth/**").uri("lb://assetflow-auth-service"))
 .route("company",r->r.path("/api/department/**","/api/employee/**","/api/admin/**","/api/location/**").uri("lb://assetflow-company-service"))
 .route("asset",r->r.path("/asset/**","/category/**","/vendor/**","/purchase-order/**","/maintenance/**","/asset-allocation/**","/asset-request/**").uri("lb://assetflow-asset-service"))
 .route("notification",r->r.path("/notification/**","/audit/**","/dashboard/**","/report/**","/ai/**").uri("lb://assetflow-notification-service"))
 .build();} }
