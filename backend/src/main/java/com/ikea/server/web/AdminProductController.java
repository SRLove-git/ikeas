package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.ikea.server.service.AdminProductService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin endpoints for products. */
@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
public class AdminProductController {

  private final AdminProductService productService;

  public AdminProductController(AdminProductService productService) {
    this.productService = productService;
  }

  @GetMapping("/products")
  public Map<String, Object> listProducts(
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int pageSize) {
    return productService.listProducts(q, page, pageSize);
  }

  @PostMapping("/products")
  public ResponseEntity<JsonNode> createProduct(@RequestBody JsonNode body) {
    return ResponseEntity.status(HttpStatus.CREATED).body(productService.upsertProduct(body, null));
  }

  @GetMapping("/products/{id}")
  public JsonNode getProduct(@PathVariable String id) {
    return productService.getProduct(id);
  }

  @PutMapping("/products/{id}")
  public JsonNode updateProduct(@PathVariable String id, @RequestBody JsonNode body) {
    return productService.upsertProduct(body, id);
  }

  @DeleteMapping("/products/{id}")
  public ResponseEntity<Map<String, Boolean>> deleteProduct(@PathVariable String id) {
    boolean removed = productService.deleteProduct(id);
    if (!removed) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));
    }
    return ResponseEntity.ok(Map.of("ok", true));
  }
}
