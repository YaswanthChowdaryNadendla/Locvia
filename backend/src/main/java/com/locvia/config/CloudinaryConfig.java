package com.locvia.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Spring configuration providing the Cloudinary client bean.
 * Reads credentials securely from environment variables / application properties
 * without hardcoding sensitive secrets.
 */
@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName != null && !cloudName.isBlank() ? cloudName : "locvia");
        config.put("api_key", apiKey != null && !apiKey.isBlank() ? apiKey : "locvia_key");
        config.put("api_secret", apiSecret != null && !apiSecret.isBlank() ? apiSecret : "locvia_secret");
        return new Cloudinary(config);
    }
}
