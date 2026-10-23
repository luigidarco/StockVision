package org.stockvision.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.stockvision.User;
import org.stockvision.UserRepository;
import tools.jackson.databind.json.JsonMapper;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.profiles.active=test",
        "spring.datasource.url=jdbc:h2:mem:authentication;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthenticationIntegrationTest {
    private static final String PASSWORD = "integration-test-password";
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Autowired private UserRepository users;
    @Autowired private PasswordEncoder encoder;
    @Value("${local.server.port}") private int port;

    private HttpClient client;
    private String email;
    private Long userId;

    @BeforeEach
    void setUp() {
        client = HttpClient.newBuilder()
                .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
                .build();
        email = UUID.randomUUID() + "@example.test";
        var user = new User("Test user");
        user.setCredentials(email, encoder.encode(PASSWORD));
        userId = users.save(user).getId();
    }

    @Test
    void anonymousRequestsCannotReadInventoryOrCurrentUser() throws Exception {
        for (String path : new String[]{"/api/items", "/api/items/1", "/api/users/1/environments", "/api/auth/me"}) {
            var response = get(path);
            assertEquals(401, response.statusCode());
            assertTrue(response.headers().firstValue("content-type").orElse("").contains("application/json"));
        }
    }

    @Test
    void wrongCredentialsDoNotCreateAuthenticatedSession() throws Exception {
        var response = login("wrong-password");
        assertEquals(401, response.statusCode());
        assertEquals("E-mail ou senha inválidos.", JSON.readTree(response.body()).get("message").asString());
        assertEquals(401, get("/api/auth/me").statusCode());
    }

    @Test
    void validLoginPersistsIdentityWithoutExposingCredentials() throws Exception {
        assertEquals(204, login(PASSWORD).statusCode());
        var response = get("/api/auth/me");
        assertEquals(200, response.statusCode());
        var user = JSON.readTree(response.body());
        assertEquals(userId.longValue(), user.get("id").asLong());
        assertEquals(email, user.get("email").asString());
        assertNull(user.get("passwordHash"));
        assertFalse(response.body().contains(PASSWORD));
        assertEquals(200, get("/api/items").statusCode());
    }

    @Test
    void loginRequiresCsrfProtection() throws Exception {
        var response = client.send(HttpRequest.newBuilder(uri("/api/auth/login"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(credentials(PASSWORD))).build(),
                HttpResponse.BodyHandlers.ofString());
        assertEquals(403, response.statusCode());
        assertEquals(401, get("/api/auth/me").statusCode());
    }

    @Test
    void authenticatedWritesWithoutCsrfAreRejected() throws Exception {
        assertEquals(204, login(PASSWORD).statusCode());
        var response = client.send(HttpRequest.newBuilder(uri("/api/items"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}")).build(),
                HttpResponse.BodyHandlers.ofString());
        assertEquals(403, response.statusCode());
    }

    @Test
    void logoutInvalidatesTheSession() throws Exception {
        assertEquals(204, login(PASSWORD).statusCode());
        var csrf = JSON.readTree(get("/api/auth/csrf").body());
        var response = client.send(HttpRequest.newBuilder(uri("/api/auth/logout"))
                .header(csrf.get("headerName").asString(), csrf.get("token").asString())
                .POST(HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(204, response.statusCode());
        assertEquals(401, get("/api/items").statusCode());
        assertEquals(401, get("/api/auth/me").statusCode());
    }

    private HttpResponse<String> login(String password) throws Exception {
        var csrf = JSON.readTree(get("/api/auth/csrf").body());
        return client.send(HttpRequest.newBuilder(uri("/api/auth/login"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header(csrf.get("headerName").asString(), csrf.get("token").asString())
                .POST(HttpRequest.BodyPublishers.ofString(credentials(password))).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private String credentials(String password) {
        return "email=" + URLEncoder.encode(email, StandardCharsets.UTF_8)
                + "&password=" + URLEncoder.encode(password, StandardCharsets.UTF_8);
    }

    private HttpResponse<String> get(String path) throws Exception {
        return client.send(HttpRequest.newBuilder(uri(path)).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}
