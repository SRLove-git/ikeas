package com.ikea.server.web;

import com.ikea.server.data.DataStore;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

  private final DataStore store;

  public HealthController(DataStore store) {
    this.store = store;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("status", "UP");
    body.put("service", "ikea-server");
    body.put("timestamp", OffsetDateTime.now().toString());
    return body;
  }

  @GetMapping("/stats")
  public Map<String, Object> stats() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("catalogCategories", store.catalogCategories().size());
    body.put("channelCategories", store.channelCategories().size());
    body.put("menuCategories", store.menuCategories().size());
    body.put("menuPanels", store.menuPanels().size());
    body.put("catalogPages", store.catalogPages().size());
    body.put("contentPages", store.contentPages().size());
    body.put("products", store.allProducts().size());
    body.put("searchableProducts", store.searchableProducts().size());
    return body;
  }
}
