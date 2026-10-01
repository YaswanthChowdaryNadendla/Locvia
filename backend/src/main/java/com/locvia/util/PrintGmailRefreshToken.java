package com.locvia.util;

import com.google.api.client.auth.oauth2.StoredCredential;
import com.google.api.client.util.store.DataStore;
import com.google.api.client.util.store.FileDataStoreFactory;

import java.io.File;

/**
 * Utility to read the locally cached OAuth 2.0 refresh token for Gmail API.
 * Prints ONLY: GMAIL_REFRESH_TOKEN=<token>
 */
public class PrintGmailRefreshToken {

    public static void main(String[] args) {
        try {
            File tokensDirectory = new File(System.getProperty("user.home"), ".locvia-tokens");
            if (!tokensDirectory.exists() || !tokensDirectory.isDirectory()) {
                System.err.println("ERROR: Token directory not found at " + tokensDirectory.getAbsolutePath());
                System.exit(1);
            }

            FileDataStoreFactory factory = new FileDataStoreFactory(tokensDirectory);
            DataStore<StoredCredential> dataStore = factory.getDataStore(StoredCredential.DEFAULT_DATA_STORE_ID);
            StoredCredential credential = dataStore.get("user");

            if (credential == null || credential.getRefreshToken() == null || credential.getRefreshToken().isBlank()) {
                System.err.println("ERROR: No refresh token found in stored credential.");
                System.exit(1);
            }

            System.out.println("GMAIL_REFRESH_TOKEN=" + credential.getRefreshToken());
        } catch (Exception e) {
            System.err.println("ERROR reading stored credential: " + e.getMessage());
            System.exit(1);
        }
    }
}
