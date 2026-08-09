package com.ikea.server.data;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Per-user favorite product ids, kept in memory. */
@Component
public class FavoritesStore {

  private final Map<String, LinkedHashSet<String>> favorites = new ConcurrentHashMap<>();

  public Set<String> idsFor(String userId) {
    return favorites.computeIfAbsent(userId, ignored -> new LinkedHashSet<>());
  }

  public void add(String userId, String productId) {
    idsFor(userId).add(productId);
  }

  public void remove(String userId, String productId) {
    idsFor(userId).remove(productId);
  }

  /** All non-empty favorite lists, newest first (used by the admin panel). */
  public java.util.List<Map.Entry<String, LinkedHashSet<String>>> allFavorites() {
    return favorites.entrySet().stream()
        .filter(entry -> !entry.getValue().isEmpty())
        .sorted((a, b) -> b.getValue().size() - a.getValue().size())
        .toList();
  }
}
