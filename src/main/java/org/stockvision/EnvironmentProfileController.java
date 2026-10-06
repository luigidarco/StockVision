package org.stockvision;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/environments")
public class EnvironmentProfileController {
    private final EnvironmentProfileRepository profileRepository;
    private final UserRepository userRepository;

    public EnvironmentProfileController(EnvironmentProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<EnvironmentProfile> getAll(@PathVariable Long userId) {
        requireUser(userId);
        return profileRepository.findByUserIdOrderByName(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnvironmentProfile create(@PathVariable Long userId, @Valid @RequestBody EnvironmentProfile profile) {
        profile.setUser(requireUser(userId));
        return profileRepository.save(profile);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
