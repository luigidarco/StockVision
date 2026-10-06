package org.stockvision;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DevelopmentDataInitializer {
    @Bean
    CommandLineRunner seedDevelopmentProfiles(UserRepository userRepository,
                                               EnvironmentProfileRepository profileRepository,
                                               ItemRepository itemRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                User user = userRepository.save(new User("Usuário principal"));
                profileRepository.save(new EnvironmentProfile("Casa", EnvironmentType.HOME, user));
                profileRepository.save(new EnvironmentProfile("Trabalho", EnvironmentType.WORK, user));
            }

            User user = userRepository.findAll().get(0);
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
                    item.setCategoryLabel("");
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
