package com.locvia;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

/**
 * Main entry point for the Locvia Grocery Delivery Platform backend application.
 */
@SpringBootApplication
public class LocviaApplication {

    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(LocviaApplication.class, args);
    }

    private static void loadDotEnvIfPresent() {
        File envFile = new File(".env");
        if (!envFile.exists()) {
            envFile = new File("backend/.env");
        }
        if (envFile.exists() && envFile.isFile()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                        continue;
                    }
                    int idx = line.indexOf('=');
                    String key = line.substring(0, idx).trim();
                    String val = line.substring(idx + 1).trim();
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, val);
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }
}
