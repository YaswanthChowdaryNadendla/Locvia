package com.locvia.controller;

import com.locvia.dto.AddressResponse;
import com.locvia.dto.CreateAddressRequest;
import com.locvia.dto.UpdateAddressRequest;
import com.locvia.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * REST controller for customer delivery address operations.
 * Strictly requires ROLE_CUSTOMER.
 */
@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    /**
     * Retrieves all saved delivery addresses for the authenticated customer.
     */
    @GetMapping
    public ResponseEntity<List<AddressResponse>> getMyAddresses(Principal principal) {
        List<AddressResponse> addresses = addressService.getMyAddresses(principal.getName());
        return ResponseEntity.ok(addresses);
    }

    /**
     * Retrieves a single address by ID belonging to the authenticated customer.
     */
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<AddressResponse> getAddressById(@PathVariable Long id, Principal principal) {
        AddressResponse address = addressService.getAddressById(principal.getName(), id);
        return ResponseEntity.ok(address);
    }

    /**
     * Saves a new delivery address for the authenticated customer.
     */
    @PostMapping
    public ResponseEntity<AddressResponse> createAddress(
            @Valid @RequestBody CreateAddressRequest request,
            Principal principal) {
        AddressResponse created = addressService.createAddress(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing delivery address for the authenticated customer.
     */
    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAddressRequest request,
            Principal principal) {
        AddressResponse updated = addressService.updateAddress(principal.getName(), id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Sets the specified address as the customer's primary default address.
     * Supports both PATCH and PUT to accommodate different client conventions.
     */
    @RequestMapping(value = "/{id:[0-9]+}/default", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<AddressResponse> setDefaultAddress(@PathVariable Long id, Principal principal) {
        AddressResponse updated = addressService.setDefaultAddress(principal.getName(), id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deletes a delivery address belonging to the authenticated customer.
     */
    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id, Principal principal) {
        addressService.deleteAddress(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
