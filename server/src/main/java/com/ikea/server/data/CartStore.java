package com.ikea.server.data;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Per-user shopping bag, kept in memory. */
@Component
public class CartStore {

  public record CartEntry(int quantity, long addedAt) {}

  private final Map<String, LinkedHashMap<String, CartEntry>> carts = new ConcurrentHashMap<>();

  public LinkedHashMap<String, CartEntry> cartFor(String userId) {
    return carts.computeIfAbsent(userId, ignored -> new LinkedHashMap<>());
  }

  public void add(String userId, String productId, int quantity) {
    int qty = Math.max(1, Math.min(quantity, 99));
    cartFor(userId)
        .compute(
            productId,
            (ignored, existing) ->
                new CartEntry(
                    Math.min(99, (existing == null ? 0 : existing.quantity()) + qty),
                    existing == null ? System.currentTimeMillis() : existing.addedAt()));
  }

  public void setQuantity(String userId, String productId, int quantity) {
    if (quantity <= 0) {
      cartFor(userId).remove(productId);
      return;
    }
    cartFor(userId)
        .compute(
            productId,
            (ignored, existing) ->
                new CartEntry(
                    Math.min(quantity, 99),
                    existing == null ? System.currentTimeMillis() : existing.addedAt()));
  }

  public void remove(String userId, String productId) {
    cartFor(userId).remove(productId);
  }

  public void clear(String userId) {
    cartFor(userId).clear();
  }

  /** All non-empty carts, newest first (used by the admin panel). */
  public java.util.List<Map.Entry<String, LinkedHashMap<String, CartEntry>>> allCarts() {
    return carts.entrySet().stream()
        .filter(entry -> !entry.getValue().isEmpty())
        .sorted((a, b) -> Long.compare(b.getValue().values().stream().mapToLong(CartEntry::addedAt).max().orElse(0),
            a.getValue().values().stream().mapToLong(CartEntry::addedAt).max().orElse(0)))
        .toList();
  }
}
