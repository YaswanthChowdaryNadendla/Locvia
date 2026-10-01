package com.locvia.util;

import com.google.api.client.auth.oauth2.AuthorizationCodeRequestUrl;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.gmail.GmailScopes;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * Temporary local-only OAuth authorization utility for Locvia.
 * Authorizes the Gmail account via Google OAuth 2.0 and retrieves a refresh token.
 */
public class GmailOAuthHelper {

    private static final String GMAIL_SEND_SCOPE = GmailScopes.GMAIL_SEND; // https://www.googleapis.com/auth/gmail.send

    public static void main(String[] args) {
        try {
            System.out.println("======================================================================");
            System.out.println("  Locvia Gmail API - Local OAuth 2.0 Authorization Utility");
            System.out.println("======================================================================");

            File clientSecretFile = resolveClientSecretFile(args);
            if (clientSecretFile == null || !clientSecretFile.exists()) {
                System.err.println("ERROR: Could not find Google OAuth client secret JSON file.");
                System.err.println("Please provide the path as an argument or ensure it is in your Downloads folder.");
                System.exit(1);
            }

            System.out.println("Found client credentials file: " + clientSecretFile.getName());

            // 1. Load client secrets
            GoogleClientSecrets clientSecrets;
            try (InputStreamReader reader = new InputStreamReader(new FileInputStream(clientSecretFile), StandardCharsets.UTF_8)) {
                clientSecrets = GoogleClientSecrets.load(GsonFactory.getDefaultInstance(), reader);
            }

            // 2. Setup NetHttpTransport and JSON Factory
            NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

            // 3. Store tokens outside the repository in the user's home directory
            File tokensDirectory = new File(System.getProperty("user.home"), ".locvia-tokens");
            if (!tokensDirectory.exists()) {
                tokensDirectory.mkdirs();
            }
            FileDataStoreFactory dataStoreFactory = new FileDataStoreFactory(tokensDirectory);

            // 4. Request ONLY https://www.googleapis.com/auth/gmail.send with offline access
            List<String> scopes = Collections.singletonList(GMAIL_SEND_SCOPE);

            GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                    httpTransport,
                    jsonFactory,
                    clientSecrets,
                    scopes
            )
                    .setDataStoreFactory(dataStoreFactory)
                    .setAccessType("offline")
                    .setApprovalPrompt(null)
                    .build();

            // 5. Use LocalServerReceiver to handle the OAuth redirect callback automatically
            LocalServerReceiver receiver = new LocalServerReceiver.Builder()
                    .setPort(8888)
                    .build();

            System.out.println("\nOpening authorization URL in your default browser...");
            System.out.println("Requested scope: " + GMAIL_SEND_SCOPE);
            System.out.println("Please log in with the Gmail account to use for Locvia and approve permissions.\n");

            // 6. Run the installed app authorization flow with prompt=consent to ensure refresh token is returned
            Credential credential = new AuthorizationCodeInstalledApp(flow, receiver) {
                @Override
                protected void onAuthorization(AuthorizationCodeRequestUrl authorizationUrl) throws java.io.IOException {
                    authorizationUrl.set("approval_prompt", null);
                    authorizationUrl.set("prompt", "consent");
                    authorizationUrl.set("access_type", "offline");
                    System.out.println("If the browser did not open automatically, visit this URL:");
                    System.out.println(authorizationUrl.build());
                    System.out.println();
                    super.onAuthorization(authorizationUrl);
                }
            }.authorize("user");

            String refreshToken = credential.getRefreshToken();

            if (refreshToken == null || refreshToken.isBlank()) {
                System.err.println("\nChecking token store for existing refresh token...");
                com.google.api.client.auth.oauth2.StoredCredential stored =
                        flow.getCredentialDataStore().get("user");
                if (stored != null) {
                    refreshToken = stored.getRefreshToken();
                }
            }

            if (refreshToken != null && !refreshToken.isBlank()) {
                System.out.println("\n======================================================================");
                System.out.println("OAUTH AUTHORIZATION SUCCEEDED!");
                System.out.println("Scope granted: " + GMAIL_SEND_SCOPE);
                System.out.println("----------------------------------------------------------------------");
                System.out.println("GMAIL_REFRESH_TOKEN=" + refreshToken);
                System.out.println("======================================================================\n");
                System.out.println("Copy the GMAIL_REFRESH_TOKEN above. Do NOT share or commit it.");
            } else {
                System.err.println("\nERROR: Failed to obtain refresh token. Please re-run and ensure you approve consent.");
            }

        } catch (Exception e) {
            System.err.println("\nOAuth authorization failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static File resolveClientSecretFile(String[] args) {
        if (args.length > 0 && !args[0].isBlank()) {
            File f = new File(args[0]);
            if (f.exists()) return f;
        }

        String sysProp = System.getProperty("clientSecret");
        if (sysProp != null && !sysProp.isBlank()) {
            File f = new File(sysProp);
            if (f.exists()) return f;
        }

        String envVar = System.getenv("GMAIL_CLIENT_SECRET_PATH");
        if (envVar != null && !envVar.isBlank()) {
            File f = new File(envVar);
            if (f.exists()) return f;
        }

        // Check user Downloads folder
        File downloads = new File(System.getProperty("user.home"), "Downloads");
        if (downloads.exists() && downloads.isDirectory()) {
            File[] matches = downloads.listFiles((dir, name) -> name.startsWith("client_secret_") && name.endsWith(".json"));
            if (matches != null && matches.length > 0) {
                Arrays.sort(matches, Comparator.comparingLong(File::lastModified).reversed());
                return matches[0];
            }
        }

        // Check current directory
        File currentDir = new File(".");
        File[] localMatches = currentDir.listFiles((dir, name) -> name.startsWith("client_secret_") && name.endsWith(".json"));
        if (localMatches != null && localMatches.length > 0) {
            Arrays.sort(localMatches, Comparator.comparingLong(File::lastModified).reversed());
            return localMatches[0];
        }

        return null;
    }
}
