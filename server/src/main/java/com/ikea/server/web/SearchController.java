package com.ikea.server.web;

import com.ikea.server.data.DataStore;
import com.ikea.server.model.SearchResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SearchController {

  private final DataStore store;

  public SearchController(DataStore store) {
    this.store = store;
  }

  @GetMapping("/search")
  public SearchResponse search(
      @RequestParam String q,
      @RequestParam(defaultValue = "20") int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 100));
    return new SearchResponse(
        q,
        store.searchProducts(q, safeLimit),
        store.searchContentPages(q, safeLimit),
        store.searchCatalogPages(q, safeLimit));
  }
}
