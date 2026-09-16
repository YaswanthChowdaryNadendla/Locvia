package com.locvia;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LocviaApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Application context loads successfully with MySQL DataSource")
    void contextLoads() {
        assertThat(dataSource).isNotNull();
    }

    @Test
    @DisplayName("Verify live MySQL database connection and catalog")
    void verifyDatabaseConnection() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection.isValid(2)).isTrue();
            DatabaseMetaData metaData = connection.getMetaData();
            assertThat(metaData.getDatabaseProductName()).containsIgnoringCase("MySQL");
            assertThat(connection.getCatalog()).isEqualToIgnoringCase("locvia_db");
        }
    }

    @Test
    @DisplayName("Verify all 14 JPA entity tables are created in locvia_db by Hibernate")
    void verifyEntityTablesCreated() throws Exception {
        List<String> expectedTables = List.of(
                "users",
                "shops",
                "categories",
                "products",
                "inventories",
                "addresses",
                "carts",
                "cart_items",
                "orders",
                "order_items",
                "deliveries",
                "payments",
                "reviews",
                "notifications"
        );

        Set<String> actualTables = new HashSet<>();
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            try (ResultSet rs = metaData.getTables("locvia_db", null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    actualTables.add(rs.getString("TABLE_NAME").toLowerCase());
                }
            }
        }

        assertThat(actualTables).containsAll(expectedTables);
    }

    @Test
    @DisplayName("GET /api/health returns 200 OK with expected JSON payload")
    void healthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/health")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("Locvia Backend"));
    }
}
