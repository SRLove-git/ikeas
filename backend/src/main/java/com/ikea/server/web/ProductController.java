package com.ikea.server.web;

import com.ikea.server.data.DataStore;
import com.ikea.server.model.CategoryMatch;
import com.ikea.server.model.CategoryRef;
import com.ikea.server.model.Paged;
import com.ikea.server.model.Product;
import com.ikea.server.model.ProductMatch;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ProductController {

  private final DataStore store;

  public ProductController(DataStore store) {
    this.store = store;
  }

  /** List / search products. Supports q, categorySlug, page and size. */
  @GetMapping("/products")
  public Paged<Product> products(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String categorySlug,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "48") int size) {
    List<Product> source;
    if (categorySlug != null && !categorySlug.isBlank()) {
      CategoryMatch match = store.findCategoryBySlug(categorySlug);
      if (match == null) {
        throw new ResourceNotFoundException("Category not found: " + categorySlug);
      }
      source = match.category().products() == null ? List.of() : match.category().products();
    } else {
      source = store.searchableProducts();
    }
    return Paged.of(store.filterProducts(source, q), page, size);
  }

  @GetMapping("/products/slug/{slug}")
  public ProductMatch productBySlug(@PathVariable String slug) {
    Product product = store.findProductBySlug(slug);
    if (product == null) {
      throw new ResourceNotFoundException("Product not found: " + slug);
    }
    return new ProductMatch(product, categoryOf(product));
  }

  @GetMapping("/products/{id}")
  public ProductMatch productById(@PathVariable String id) {
    Product product = store.findProductById(id);
    if (product == null) {
      throw new ResourceNotFoundException("Product not found: " + id);
    }
    return new ProductMatch(product, categoryOf(product));
  }

  private CategoryRef categoryOf(Product product) {
    return store.findCategoryForProductId(product.id());
  }
}
