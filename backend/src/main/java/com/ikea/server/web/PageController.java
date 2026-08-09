package com.ikea.server.web;

import com.ikea.server.data.DataStore;
import com.ikea.server.model.CatalogPage;
import com.ikea.server.model.ContentPage;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PageController {

  private final DataStore store;

  public PageController(DataStore store) {
    this.store = store;
  }

  /**
   * Content pages. Pass ?url= to fetch a single page by URL, otherwise filter
   * by ?family= plus optional ?depth= / ?minDepth=.
   */
  @GetMapping("/pages")
  public Object pages(
      @RequestParam(required = false) String url,
      @RequestParam(required = false) String family,
      @RequestParam(required = false) Integer depth,
      @RequestParam(required = false) Integer minDepth) {
    if (url != null && !url.isBlank()) {
      ContentPage page = store.findContentPage(url);
      if (page == null) {
        throw new ResourceNotFoundException("Page not found: " + url);
      }
      return page;
    }
    if (family != null && !family.isBlank()) {
      if (depth != null) {
        return store.pagesAtDepth(family, depth);
      }
      if (minDepth != null) {
        return store.pagesDeeper(family, minDepth);
      }
      return store.pagesByFamily(family);
    }
    return store.contentPages();
  }

  @GetMapping("/pages/families")
  public Map<String, Integer> families() {
    Map<String, Integer> counts = new LinkedHashMap<>();
    for (String family : store.families()) {
      counts.put(family, store.pagesByFamily(family).size());
    }
    return counts;
  }

  @GetMapping("/catalog-pages")
  public List<CatalogPage> catalogPages(@RequestParam(required = false) String q) {
    return store.searchCatalogPages(q == null ? "" : q, Integer.MAX_VALUE);
  }

  @GetMapping("/catalog-pages/{slug}")
  public CatalogPage catalogPageBySlug(@PathVariable String slug) {
    CatalogPage page = store.findCatalogPageBySlug(slug);
    if (page == null) {
      throw new ResourceNotFoundException("Catalog page not found: " + slug);
    }
    return page;
  }
}
