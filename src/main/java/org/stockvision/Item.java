package org.stockvision;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "items")
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Size(max = 100)
    private String brand;

    @NotBlank
    @Size(max = 100)
    @Column(name = "category_label")
    private String categoryLabel;

    @Size(max = 150)
    @Column(name = "room_location")
    private String roomLocation;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Integer quantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "environment_profile_id")
    private EnvironmentProfile environmentProfile;

    @JsonManagedReference
    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<@jakarta.validation.Valid SubItem> subItems = new ArrayList<>();

    protected Item() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategoryLabel() {
        return categoryLabel;
    }

    public void setCategoryLabel(String categoryLabel) {
        this.categoryLabel = categoryLabel;
    }

    public String getRoomLocation() {
        return roomLocation;
    }

    public void setRoomLocation(String roomLocation) {
        this.roomLocation = roomLocation;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public EnvironmentProfile getEnvironmentProfile() {
        return environmentProfile;
    }

    public void setEnvironmentProfile(EnvironmentProfile environmentProfile) {
        this.environmentProfile = environmentProfile;
    }

    public List<SubItem> getSubItems() {
        return subItems.stream()
                .sorted(Comparator.comparing(SubItem::getSequence))
                .toList();
    }

    public void setSubItems(List<SubItem> subItems) {
        this.subItems.clear();
        if (subItems != null) {
            subItems.forEach(this::addSubItem);
        }
    }

    public void addSubItem(SubItem subItem) {
        subItem.setItem(this);
        subItems.add(subItem);
    }
}
