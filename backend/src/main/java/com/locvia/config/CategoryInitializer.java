package com.locvia.config;

import com.locvia.entity.Category;
import com.locvia.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Idempotently provisions default platform product categories on application startup
 * if they do not already exist in the database.
 */
@Component
@Order(10)
public class CategoryInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CategoryInitializer.class);

    public static final List<String> DEFAULT_CATEGORIES = List.of(
            "Paan Corner",
            "Dairy, Bread & Eggs",
            "Fruits & Vegetables",
            "Cold Drinks & Juices",
            "Snacks & Munchies",
            "Breakfast & Instant Food",
            "Sweet Tooth",
            "Bakery & Biscuits",
            "Tea, Coffee & Milk Drinks",
            "Atta, Rice & Dal",
            "Masala, Oil & More",
            "Sauces & Spreads",
            "Chicken, Meat & Fish",
            "Organic & Healthy Living",
            "Baby Care",
            "Pharma & Wellness",
            "Cleaning Essentials",
            "Home & Office",
            "Personal Care",
            "Pet Care"
    );

    private final CategoryRepository categoryRepository;

    public CategoryInitializer(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        try {
            for (String name : DEFAULT_CATEGORIES) {
                if (!categoryRepository.existsByNameIgnoreCase(name)) {
                    Category category = new Category();
                    category.setName(name);
                    category.setDescription(name);
                    category.setActive(true);
                    categoryRepository.save(category);
                    log.info("Initialized default product category: {}", name);
                }
            }
        } catch (Exception ex) {
            log.error("Failed to initialize default categories: {}", ex.getMessage(), ex);
        }
    }
}
