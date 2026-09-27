package com.locvia;

import com.locvia.config.CategoryInitializer;
import com.locvia.entity.Category;
import com.locvia.repository.CategoryRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CategoryInitializerTests {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CategoryInitializer categoryInitializer;

    @AfterEach
    void cleanUp() {
        categoryRepository.deleteAll();
    }

    @Test
    @DisplayName("CategoryInitializer provisions all 20 default categories idempotently")
    void categoryInitializerProvisionsAllCategoriesIdempotently() {
        categoryRepository.deleteAll();
        assertThat(categoryRepository.count()).isZero();

        // 1. First run: provisions 20 default categories
        categoryInitializer.run();
        assertThat(categoryRepository.count()).isEqualTo(20);

        List<Category> allCategories = categoryRepository.findByActiveTrue();
        assertThat(allCategories).hasSize(20);
        assertThat(allCategories).extracting(Category::getName)
                .contains("Masala, Oil & More", "Dairy, Bread & Eggs", "Fruits & Vegetables", "Atta, Rice & Dal");

        // 2. Second run: idempotent, count remains 20
        categoryInitializer.run();
        assertThat(categoryRepository.count()).isEqualTo(20);
    }
}
