package org.stockvision.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.stockvision.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;

    public AuthController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getToken());
    }

    @GetMapping("/me")
    public CurrentUser me(Authentication authentication) {
        var user = users.findByEmail(authentication.getName()).orElseThrow();
        return new CurrentUser(user.getId(), user.getName(), user.getEmail());
    }

    public record CsrfResponse(String headerName, String token) {}

    public record CurrentUser(Long id, String name, String email) {}
}
