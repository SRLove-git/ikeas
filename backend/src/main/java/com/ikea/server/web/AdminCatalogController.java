package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.ikea.server.model.CatalogPage;
import com.ikea.server.service.AdminCatalogService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin endpoints for catalog categories and category landing pages. */
@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
public class AdminCatalogController {

  private final AdminCatalogService catalogService;

  public AdminCatalogController(AdminCatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping("/catalog-pages")
  public Map<String, Object> listCatalogPages() {
    List<CatalogPage> items = catalogService.listCatalogPages();
    return Map.of("items", items, "total", items.size());
  }

  @PostMapping("/catalog-pages")
  public ResponseEntity<CatalogPage> createCatalogPage(@RequestBody JsonNode body) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(catalogService.upsertCatalogPage(body, null));
  }

  @GetMapping("/catalog-pages/{slug}")
  public CatalogPage getCatalogPage(@PathVariable String slug) {
    return catalogService.getCatalogPage(slug);
  }

  @PutMapping("/catalog-pages/{slug}")
  public CatalogPage updateCatalogPage(
      @PathVariable String slug, @RequestBody JsonNode body) {
    return catalogService.upsertCatalogPage(body, slug);
  }

  @DeleteMapping("/catalog-pages/{slug}")
  public ResponseEntity<Map<String, Boolean>> deleteCatalogPage(@PathVariable String slug) {
    boolean removed = catalogService.deleteCatalogPage(slug);
    if (!removed) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));
    }
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @GetMapping("/categories")
  public JsonNode categories() {
    return catalogService.getCategories();
  }

  @PutMapping("/categories")
  public JsonNode updateCategories(@RequestBody JsonNode body) {
    return catalogService.updateCategories(body);
  }
}
