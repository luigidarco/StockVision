package org.stockvision;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {
    private final ItemRepository itemRepository;
    private final EnvironmentProfileRepository environmentProfileRepository;

    public ItemController(ItemRepository itemRepository, EnvironmentProfileRepository environmentProfileRepository) {
        this.itemRepository = itemRepository;
        this.environmentProfileRepository = environmentProfileRepository;
    }

    @GetMapping
    public List<Item> getAll(@RequestParam(required = false) Long environmentId) {
        if (environmentId != null) {
            return itemRepository.findByEnvironmentProfileId(environmentId);
        }
        return itemRepository.findAll();
    }

    @GetMapping("/{id}")
    public Item getById(@PathVariable Long id) {
        return findItem(id);
    }

    @PostMapping
    public ResponseEntity<Item> create(@Valid @RequestBody Item item) {
        attachEnvironment(item);
        Item savedItem = itemRepository.save(item);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedItem.getId())
                .toUri();
        return ResponseEntity.created(location).body(savedItem);
    }

    @PutMapping("/{id}")
    public Item update(@PathVariable Long id, @Valid @RequestBody Item item) {
        Item existingItem = findItem(id);
        existingItem.setName(item.getName());
        existingItem.setDescription(item.getDescription());
        existingItem.setQuantity(item.getQuantity());
        existingItem.setBrand(item.getBrand());
        existingItem.setCategoryLabel(item.getCategoryLabel());
        existingItem.setRoomLocation(item.getRoomLocation());
        existingItem.setEnvironmentProfile(resolveEnvironment(item.getEnvironmentProfile()));
        existingItem.setSubItems(item.getSubItems());
        return itemRepository.save(existingItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        itemRepository.delete(findItem(id));
        return ResponseEntity.noContent().build();
    }

    private Item findItem(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    private void attachEnvironment(Item item) {
        item.setEnvironmentProfile(resolveEnvironment(item.getEnvironmentProfile()));
    }

    private EnvironmentProfile resolveEnvironment(EnvironmentProfile profile) {
        if (profile == null || profile.getId() == null) {
            return null;
        }
        return environmentProfileRepository.findById(profile.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Environment not found"));
    }
}
