package org.stockvision.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.stockvision.UserRepository;

@Service
public class StockVisionUserDetailsService implements UserDetailsService {
    private final UserRepository users;

    public StockVisionUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        var user = users.findByEmail(email)
                .filter(account -> account.getPasswordHash() != null)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
        return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles("USER")
                .build();
    }
}
