package com.assetflow.gateway.config;
import org.springframework.cloud.gateway.route.RouteLocator;import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;import org.springframework.context.annotation.Bean;import org.springframework.context.annotation.Configuration;
@Configuration public class GatewayRoutes { @Bean RouteLocator routes(RouteLocatorBuilder b){return b.routes()
 .route("auth",r->r.path("/api/auth/**").uri("lb://assetflow-auth-service"))
 .route("platform",r->r.path("/api/platform/**").uri("lb://assetflow-auth-service"))
 .route("company-api",r->r.path("/api/department/**","/api/employee/**","/api/admin/**","/api/location/**").uri("lb://assetflow-company-service"))
 .route("company-legacy",r->r.path("/department/**","/employee/**","/admin/**","/location/**").filters(f->f.rewritePath("/(?<resource>.*)","/api/${resource}")).uri("lb://assetflow-company-service"))
 .route("asset-api",r->r.path("/api/asset/**","/api/category/**","/api/vendor/**","/api/purchase-order/**","/api/maintenance/**","/api/asset-allocation/**","/api/asset-request/**","/api/asset-transfer/**","/api/asset-return/**","/api/repair-history/**").filters(f->f.rewritePath("/api/(?<resource>.*)","/${resource}")).uri("lb://assetflow-asset-service"))
 .route("asset-legacy",r->r.path("/asset/**","/category/**","/vendor/**","/purchase-order/**","/maintenance/**","/asset-allocation/**","/asset-request/**","/asset-transfer/**","/asset-return/**","/repair-history/**").uri("lb://assetflow-asset-service"))
 .route("notification-api",r->r.path("/api/notification/**","/api/audit/**","/api/dashboard/**","/api/report/**","/api/ai/**","/api/email/**").filters(f->f.rewritePath("/api/(?<resource>.*)","/${resource}")).uri("lb://assetflow-notification-service"))
 .route("notification-legacy",r->r.path("/notification/**","/audit/**","/dashboard/**","/report/**","/ai/**","/email/**").uri("lb://assetflow-notification-service"))
 .build();} }
