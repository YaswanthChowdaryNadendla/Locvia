package com.locvia.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload submitted by an authenticated shop owner to create a new shop.
 * Strictly excludes identifiers, ownership, rating, and status fields to prevent client tampering.
 */
public class CreateShopRequest {

    @NotBlank(message = "Shop name cannot be blank")
    @Size(max = 150, message = "Shop name must not exceed 150 characters")
    private String name;

    private String description;

    @NotBlank(message = "Shop address cannot be blank")
    @Size(max = 255, message = "Shop address must not exceed 255 characters")
    private String address;

    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    @Email(message = "Invalid shop email format")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    private Double latitude;

    private Double longitude;

    public CreateShopRequest() {
    }

    public CreateShopRequest(String name, String description, String address, String phone, String email, String imageUrl, Double latitude, Double longitude) {
        this.name = name;
        this.description = description;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.imageUrl = imageUrl;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name != null ? name.trim() : null;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description != null ? description.trim() : null;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address != null ? address.trim() : null;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone != null ? phone.trim() : null;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim() : null;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl != null ? imageUrl.trim() : null;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
}
