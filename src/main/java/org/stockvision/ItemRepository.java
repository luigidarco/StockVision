package org.stockvision;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByEnvironmentProfileId(Long environmentId);

    List<Item> findByEnvironmentProfileIsNull();
}
