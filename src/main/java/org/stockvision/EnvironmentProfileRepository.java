package org.stockvision;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnvironmentProfileRepository extends JpaRepository<EnvironmentProfile, Long> {
    List<EnvironmentProfile> findByUserIdOrderByName(Long userId);
}
