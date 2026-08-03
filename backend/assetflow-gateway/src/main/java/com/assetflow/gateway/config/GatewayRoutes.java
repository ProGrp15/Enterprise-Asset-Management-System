package com.assetflow.gateway.config;
import org.springframework.cloud.gateway.route.RouteLocator;import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;import org.springframework.context.annotation.Bean;import org.springframework.context.annotation.Configuration;
@Configuration public class GatewayRoutes { @Bean RouteLocator routes(RouteLocatorBuilder b){return b.routes()
 .route("auth",r->r.path("/api/auth/**").uri("lb://assetflow-auth-service"))
 .route("platform",r->r.path("/api/platform/**").uri("lb://assetflow-auth-service"))
 .route("company",r->r.path("/api/department/**","/api/employee/**","/api/admin/**","/api/location/**","/api/building/**","/api/floor/**","/api/room/**").uri("lb://assetflow-company-service"))
 .route("asset",r->r.path("/asset/**","/category/**","/vendor/**","/purchase-order/**","/invoice/**","/maintenance/**","/asset-allocation/**","/asset-request/**","/asset-transfer/**","/asset-return/**","/asset-disposal/**","/repair-history/**").uri("lb://assetflow-asset-service"))
 .route("notification",r->r.path("/notification/**","/audit/**","/dashboard/**","/report/**","/ai/**","/email/**").uri("lb://assetflow-notification-service"))
 .build();} }
