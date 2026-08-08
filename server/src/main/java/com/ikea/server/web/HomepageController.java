package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.ikea.server.data.DataStore;
import com.ikea.server.model.MenuPanel;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HomepageController {

  private final DataStore store;

  public HomepageController(DataStore store) {
    this.store = store;
  }

  /** The complete homepage payload (notices, nav, hero, ranking, footer, ...). */
  @GetMapping("/homepage")
  public JsonNode homepage() {
    return store.homepage();
  }

  /** A single homepage section, e.g. /homepage/heroSlides. */
  @GetMapping("/homepage/{section}")
  public JsonNode section(@PathVariable String section) {
    JsonNode node = store.homepage().get(section);
    if (node == null || node.isNull() || node.isMissingNode()) {
      throw new ResourceNotFoundException("Homepage section not found: " + section);
    }
    return node;
  }

  @GetMapping("/menu-panels")
  public List<MenuPanel> menuPanels() {
    return store.menuPanels();
  }
}
