package org.stockvision;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@Profile("dev")
public class DevelopmentDataInitializer {
    @Bean
    CommandLineRunner seedDevelopmentProfiles(UserRepository userRepository,
                                               EnvironmentProfileRepository profileRepository,
                                               ItemRepository itemRepository,
                                               PasswordEncoder passwordEncoder,
                                               @Value("${STOCKVISION_DEV_EMAIL:admin@stockvision.local}") String email,
                                               @Value("${STOCKVISION_DEV_PASSWORD:}") String password) {
        return args -> {
            if (password.isBlank()) {
                throw new IllegalStateException("Set STOCKVISION_DEV_PASSWORD when using the dev profile.");
            }
            if (userRepository.count() == 0) {
                User user = userRepository.save(new User("Usuário principal"));
                profileRepository.save(new EnvironmentProfile("Casa", EnvironmentType.HOME, user));
                profileRepository.save(new EnvironmentProfile("Trabalho", EnvironmentType.WORK, user));
            }

            User user = userRepository.findByEmail(email).orElseGet(() ->
                    userRepository.findAll().stream()
                            .filter(account -> account.getEmail() == null)
                            .findFirst()
                            .orElseGet(() -> userRepository.save(new User("Usuário principal"))));
            if (user.getPasswordHash() == null) {
                user.setCredentials(email, passwordEncoder.encode(password));
                userRepository.save(user);
            }
            var profiles = profileRepository.findByUserIdOrderByName(user.getId());
            if (profiles.isEmpty()) {
                profiles = List.of(
                        profileRepository.save(new EnvironmentProfile("Casa", EnvironmentType.HOME, user)),
                        profileRepository.save(new EnvironmentProfile("Trabalho", EnvironmentType.WORK, user))
                );
            }

            EnvironmentProfile defaultProfile = profiles.stream()
                    .filter(profile -> profile.getType() == EnvironmentType.HOME)
                    .findFirst()
                    .orElse(profiles.get(0));

            itemRepository.findAll().forEach(item -> {
                boolean changed = false;
                if (item.getCategoryLabel() == null || item.getCategoryLabel().isBlank()) {
                    item.setCategoryLabel("Sem categoria");
                    changed = true;
                }
                if (item.getEnvironmentProfile() == null) {
                    item.setEnvironmentProfile(defaultProfile);
                    changed = true;
                }
                if (changed) {
                    itemRepository.save(item);
                }
            });
        };
    }
}
