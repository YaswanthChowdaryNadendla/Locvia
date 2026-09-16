package com.locvia.service;

import com.locvia.dto.AddressResponse;
import com.locvia.dto.CreateAddressRequest;
import com.locvia.dto.UpdateAddressRequest;
import com.locvia.entity.Address;
import com.locvia.entity.User;
import com.locvia.exception.ResourceNotFoundException;
import com.locvia.repository.AddressRepository;
import com.locvia.repository.OrderRepository;
import com.locvia.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service encapsulating customer delivery address business logic,
 * ownership enforcement, and default address lifecycle rules.
 */
@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public AddressService(
            AddressRepository addressRepository,
            UserRepository userRepository,
            OrderRepository orderRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Retrieves all addresses for the authenticated customer ordered by default address first,
     * followed by newest created. Returns an empty list if no addresses are saved.
     */
    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(String userEmail) {
        User user = getUser(userEmail);
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId())
                .stream()
                .map(AddressResponse::fromEntity)
                .toList();
    }

    /**
     * Retrieves a single address belonging to the authenticated customer.
     * Throws 404 if the address does not exist or belongs to another user.
     */
    @Transactional(readOnly = true)
    public AddressResponse getAddressById(String userEmail, Long addressId) {
        User user = getUser(userEmail);
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        return AddressResponse.fromEntity(address);
    }

    /**
     * Creates a new delivery address for the authenticated customer.
     * If this is the user's first address, it is automatically designated as default.
     * If defaultAddress is requested as true, any previously existing default is unset atomically.
     */
    @Transactional
    public AddressResponse createAddress(String userEmail, CreateAddressRequest request) {
        User user = getUser(userEmail);
        long count = addressRepository.countByUserId(user.getId());

        boolean shouldBeDefault;
        if (count == 0) {
            // Case 1: First address automatically becomes default
            shouldBeDefault = true;
        } else if (Boolean.TRUE.equals(request.defaultAddress())) {
            // Case 2: Explicitly requested as default
            shouldBeDefault = true;
        } else {
            // Case 3: Additional address without default flag
            shouldBeDefault = false;
        }

        if (shouldBeDefault && count > 0) {
            unsetDefaultAddressForUser(user.getId());
        }

        Address address = new Address();
        address.setUser(user);
        address.setLabel(request.label() != null && !request.label().isBlank() ? request.label().trim() : "Home");
        address.setFullName(request.recipientName().trim());
        address.setPhone(request.phoneNumber().trim());
        address.setAddressLine1(request.addressLine1().trim());
        address.setAddressLine2(request.addressLine2() != null && !request.addressLine2().isBlank() ? request.addressLine2().trim() : null);
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPostalCode(request.postalCode().trim());
        address.setLandmark(request.landmark() != null && !request.landmark().isBlank() ? request.landmark().trim() : null);
        address.setLatitude(request.latitude());
        address.setLongitude(request.longitude());
        address.setIsDefault(shouldBeDefault);
        address.setCountry("India");

        Address saved = addressRepository.save(address);
        return AddressResponse.fromEntity(saved);
    }

    /**
     * Updates an existing address belonging to the authenticated customer.
     * Throws 404 if the address does not exist or belongs to another user.
     */
    @Transactional
    public AddressResponse updateAddress(String userEmail, Long addressId, UpdateAddressRequest request) {
        User user = getUser(userEmail);
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        long totalCount = addressRepository.countByUserId(user.getId());

        if (Boolean.TRUE.equals(request.defaultAddress())) {
            if (!Boolean.TRUE.equals(address.getIsDefault())) {
                unsetDefaultAddressForUser(user.getId());
                address.setIsDefault(true);
            }
        } else if (Boolean.FALSE.equals(request.defaultAddress())) {
            // If customer attempts to uncheck default on their only address, keep it as default
            if (totalCount == 1 || Boolean.TRUE.equals(address.getIsDefault())) {
                address.setIsDefault(true);
            } else {
                address.setIsDefault(false);
            }
        }

        if (request.label() != null && !request.label().isBlank()) {
            address.setLabel(request.label().trim());
        }
        address.setFullName(request.recipientName().trim());
        address.setPhone(request.phoneNumber().trim());
        address.setAddressLine1(request.addressLine1().trim());
        address.setAddressLine2(request.addressLine2() != null && !request.addressLine2().isBlank() ? request.addressLine2().trim() : null);
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPostalCode(request.postalCode().trim());
        address.setLandmark(request.landmark() != null && !request.landmark().isBlank() ? request.landmark().trim() : null);
        address.setLatitude(request.latitude());
        address.setLongitude(request.longitude());

        Address updated = addressRepository.save(address);
        return AddressResponse.fromEntity(updated);
    }

    /**
     * Sets the specified address as the customer's primary default address.
     * Unsets any previous default atomically.
     */
    @Transactional
    public AddressResponse setDefaultAddress(String userEmail, Long addressId) {
        User user = getUser(userEmail);
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        if (!Boolean.TRUE.equals(address.getIsDefault())) {
            unsetDefaultAddressForUser(user.getId());
            address.setIsDefault(true);
            address = addressRepository.save(address);
        }

        return AddressResponse.fromEntity(address);
    }

    /**
     * Deletes an address belonging to the authenticated customer.
     * Throws 404 if the address does not exist or belongs to another user.
     * If the deleted address was default, the oldest remaining address is elected as the new default.
     */
    @Transactional
    public void deleteAddress(String userEmail, Long addressId) {
        User user = getUser(userEmail);
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));

        if (orderRepository.existsByAddressId(addressId)) {
            throw new IllegalArgumentException("Cannot delete address associated with historical orders.");
        }

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);
        addressRepository.flush();

        // If the deleted address was default, pick the oldest remaining address as replacement
        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }

    private void unsetDefaultAddressForUser(Long userId) {
        addressRepository.findByUserIdAndIsDefaultTrue(userId).ifPresent(currentDefault -> {
            currentDefault.setIsDefault(false);
            addressRepository.save(currentDefault);
            addressRepository.flush();
        });
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
