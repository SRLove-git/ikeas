package com.ikea.server.web;

import com.ikea.server.data.DataStore;
import com.ikea.server.data.FavoritesStore;
import com.ikea.server.model.Favorites;
import com.ikea.server.model.Product;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoritesController {

  private final FavoritesStore favoritesStore;
  private final DataStore dataStore;

  public FavoritesController(FavoritesStore favoritesStore, DataStore dataStore) {
    this.favoritesStore = favoritesStore;
    this.dataStore = dataStore;
  }

  public record AddFavoriteRequest(String productId) {}

  @GetMapping
  public Favorites favorites(HttpServletRequest request) {
    return build(userId(request));
  }

  @PostMapping
  public Favorites add(HttpServletRequest request, @RequestBody AddFavoriteRequest body) {
    Product product = dataStore.findProductById(body.productId());
    if (product == null) {
      throw new ResourceNotFoundException("Product not found: " + body.productId());
    }
    favoritesStore.add(userId(request), product.id());
    return build(userId(request));
  }

  @DeleteMapping("/{productId}")
  public Favorites remove(HttpServletRequest request, @PathVariable String productId) {
    favoritesStore.remove(userId(request), productId);
    return build(userId(request));
  }

  private Favorites build(String userId) {
    List<String> ids = List.copyOf(favoritesStore.idsFor(userId));
    List<Product> items = new ArrayList<>();
    for (String id : ids) {
      Product product = dataStore.findProductById(id);
      if (product != null) {
        items.add(product);
      }
    }
    return new Favorites(items, ids);
  }

  private static String userId(HttpServletRequest request) {
    return (String) request.getAttribute(AuthInterceptor.USER_ID_ATTRIBUTE);
  }
}
