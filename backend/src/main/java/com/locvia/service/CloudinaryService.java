package com.locvia.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service managing Cloudinary image uploads, replacements, and safe asset cleanup.
 */
@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Validates and uploads a product image to Cloudinary under 'locvia/products'.
     *
     * @param file uploaded multipart file
     * @return CloudinaryUploadResult containing secureUrl and publicId
     */
    public CloudinaryUploadResult uploadProductImage(MultipartFile file) {
        validateImageFile(file);

        try {
            String safePublicId = "prod_" + UUID.randomUUID().toString().replace("-", "");

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", "locvia/products",
                    "public_id", safePublicId,
                    "overwrite", true,
                    "resource_type", "image"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            if (secureUrl == null || secureUrl.isBlank()) {
                throw new IllegalStateException("Cloudinary upload failed: secure URL not returned");
            }

            return new CloudinaryUploadResult(secureUrl, publicId);

        } catch (IOException e) {
            logger.error("Failed to read image upload bytes", e);
            throw new com.locvia.exception.ExternalServiceException("Image upload service is temporarily unavailable", e);
        } catch (Exception e) {
            logger.error("Cloudinary upload error", e);
            throw new com.locvia.exception.ExternalServiceException("Image upload service is temporarily unavailable", e);
        }
    }

    /**
     * Safely deletes an existing image from Cloudinary.
     * Catches and logs any exceptions so primary database operations are never aborted.
     *
     * @param publicId Cloudinary public identifier
     */
    public void deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            logger.info("Successfully cleaned up Cloudinary image: {}", publicId);
        } catch (Exception e) {
            logger.warn("Non-fatal: failed to delete previous Cloudinary image {}: {}", publicId, e.getMessage());
        }
    }

    /**
     * Validates MIME content type and file size.
     *
     * @param file uploaded multipart file
     */
    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 5 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only JPEG, PNG, and WebP images are allowed.");
        }
    }

    /**
     * Result container for Cloudinary upload metadata.
     */
    public record CloudinaryUploadResult(String secureUrl, String publicId) {
    }
}
