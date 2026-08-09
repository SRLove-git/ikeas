package com.ikea.server.web;

import com.ikea.server.data.DataStore;
import com.ikea.server.model.CatalogCategory;
import com.ikea.server.model.CategoryMatch;
import com.ikea.server.model.MenuCategory;
import com.ikea.server.model.Paged;
import com.ikea.server.model.Product;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {

  private final DataStore store;

  public CatalogController(DataStore store) {
    this.store = store;
  }

  @GetMapping("/categories")
  public Map<String, List<CatalogCategory>> categories() {
    return Map.of(
        "catalogCategories", store.catalogCategories(),
        "channelCategories", store.channelCategories());
  }

  @GetMapping("/categories/menu")
  public Map<String, List<MenuCategory>> menuCategories() {
    return Map.of("categories", store.menuCategories());
  }

  @GetMapping("/categories/{slug}")
  public CategoryMatch category(@PathVariable String slug) {
    CategoryMatch match = store.findCategoryBySlug(slug);
    if (match == null) {
      throw new ResourceNotFoundException("Category not found: " + slug);
    }
    return match;
  }

  @GetMapping("/categories/{slug}/products")
  public Paged<Product> categoryProducts(
      @PathVariable String slug,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "48") int size) {
    CategoryMatch match = requireCategory(slug);
    List<Product> products =
        match.category().products() == null ? List.of() : match.category().products();
    return Paged.of(products, page, size);
  }

  private CategoryMatch requireCategory(String slug) {
    CategoryMatch match = store.findCategoryBySlug(slug);
    if (match == null) {
      throw new ResourceNotFoundException("Category not found: " + slug);
    }
    return match;
  }
}
