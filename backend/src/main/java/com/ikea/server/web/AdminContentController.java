package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.ikea.server.dto.content.ContentAdminDtos.HomepageUpdateRequest;
import com.ikea.server.dto.content.ContentAdminDtos.MenuUpdateRequest;
import com.ikea.server.dto.content.ContentAdminDtos.PageUpsertRequest;
import com.ikea.server.model.ContentPage;
import com.ikea.server.service.ContentAdminService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** CMS admin endpoints for content pages, homepage and header menus. */
@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
public class AdminContentController {

  private final ContentAdminService contentAdminService;

  public AdminContentController(ContentAdminService contentAdminService) {
    this.contentAdminService = contentAdminService;
  }

  // --------------------------------------------------------------- pages

  @GetMapping("/pages")
  public Map<String, Object> listPages(
      @RequestParam(required = false) String family, @RequestParam(required = false) String q) {
    List<ContentPage> items = contentAdminService.listPages(family, q);
    return Map.of(
        "items",
        items,
        "total",
        items.size(),
        "families",
        contentAdminService.pageFamilies());
  }

  @PostMapping("/pages")
  public ResponseEntity<ContentPage> createPage(@Valid @RequestBody PageUpsertRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(contentAdminService.upsertPage(request, null));
  }

  @GetMapping("/pages/{key}")
  public ContentPage getPage(@PathVariable String key) {
    return contentAdminService.getPage(key);
  }

  @PutMapping("/pages/{key}")
  public ContentPage updatePage(
      @PathVariable String key, @Valid @RequestBody PageUpsertRequest request) {
    return contentAdminService.upsertPage(request, key);
  }

  @DeleteMapping("/pages/{key}")
  public ResponseEntity<Map<String, Boolean>> deletePage(@PathVariable String key) {
    boolean removed = contentAdminService.deletePage(key);
    if (!removed) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));
    }
    return ResponseEntity.ok(Map.of("ok", true));
  }

  // ------------------------------------------------------------ homepage

  @GetMapping("/homepage")
  public JsonNode homepage() {
    return contentAdminService.getHomepage();
  }

  @PutMapping("/homepage")
  public JsonNode updateHomepage(@Valid @RequestBody HomepageUpdateRequest request) {
    return contentAdminService.updateHomepage(request.updates());
  }

  // ---------------------------------------------------------------- menu

  @GetMapping("/menu")
  public JsonNode menu() {
    return contentAdminService.getMenu();
  }

  @PutMapping("/menu")
  public JsonNode updateMenu(@Valid @RequestBody MenuUpdateRequest request) {
    return contentAdminService.updateMenu(request.menuPanels(), request.menuCategories());
  }
}
