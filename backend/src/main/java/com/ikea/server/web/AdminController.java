package com.ikea.server.web;

import com.ikea.server.data.CartStore;
import com.ikea.server.data.ChatHistoryStore;
import com.ikea.server.data.FavoritesStore;
import com.ikea.server.data.UserStore;
import com.ikea.server.data.UserStore.StoredUser;
import com.ikea.server.model.User;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoints used by the CMS panel (protected by X-Admin-Key via
 * AdminKeyInterceptor). Manages users, carts, favorites and chat history.
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

  private static Map<String, Object> hash(Object... keyValues) {
    Map<String, Object> result = new LinkedHashMap<>();
    for (int i = 0; i + 1 < keyValues.length; i += 2) {
      Object key = keyValues[i];
      Object value = keyValues[i + 1];
      if (key instanceof String name && value != null) {
        result.put(name, value);
      }
    }
    return result;
  }

  private final UserStore userStore;
  private final CartStore cartStore;
  private final FavoritesStore favoritesStore;
  private final ChatHistoryStore chatHistory;

  public AdminController(
      UserStore userStore,
      CartStore cartStore,
      FavoritesStore favoritesStore,
      ChatHistoryStore chatHistory) {
    this.userStore = userStore;
    this.cartStore = cartStore;
    this.favoritesStore = favoritesStore;
    this.chatHistory = chatHistory;
  }

  @GetMapping("/stats")
  public Map<String, Object> stats() {
    return Map.of(
        "users", userStore.allUsers().size(),
        "carts", cartStore.allCarts().size(),
        "favorites", favoritesStore.allFavorites().size(),
        "chatMessages", chatHistory.all().size());
  }

  // ------------------------------------------------------------- users

  @GetMapping("/users")
  public Map<String, Object> users() {
    List<User> items =
        userStore.allUsers().stream()
            .map(user -> new User(user.id(), user.name(), user.phone(), user.email(), user.createdAt()))
            .toList();
    return Map.of("items", items, "total", items.size());
  }

  @DeleteMapping("/users/{id}")
  public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String id) {
    boolean removed = userStore.deleteUser(id);
    if (!removed) {
      return ResponseEntity.status(404).body(Map.of("error", "用户不存在"));
    }
    cartStore.clear(id);
    favoritesStore.idsFor(id).clear();
    return ResponseEntity.ok(Map.of("ok", true));
  }

  // ------------------------------------------------------------- carts

  @GetMapping("/carts")
  public Map<String, Object> carts() {
    List<Map<String, Object>> items =
        cartStore.allCarts().stream()
            .map(
                entry -> {
                  StoredUser user = userStore.findById(entry.getKey());
                  List<Map<String, Object>> cartItems =
                      entry.getValue().entrySet().stream()
                          .map(
                              item ->
                                  Map.<String, Object>of(
                                      "productId",
                                      item.getKey(),
                                      "quantity",
                                      item.getValue().quantity(),
                                      "addedAt",
                                      item.getValue().addedAt()))
                          .toList();
                  return hash(
                      "userId",
                      entry.getKey(),
                      "user",
                      user == null
                          ? null
                          : hash("name", user.name(), "phone", user.phone()),
                      "items",
                      cartItems);
                })
            .toList();
    return Map.of("items", items, "total", items.size());
  }

  @DeleteMapping("/carts/{userId}")
  public Map<String, Object> clearCart(@PathVariable String userId) {
    cartStore.clear(userId);
    return Map.of("ok", true);
  }

  // -------------------------------------------------------- favorites

  @GetMapping("/favorites")
  public Map<String, Object> favorites() {
    List<Map<String, Object>> items =
        favoritesStore.allFavorites().stream()
            .map(
                entry -> {
                  StoredUser user = userStore.findById(entry.getKey());
                  return hash(
                      "userId",
                      entry.getKey(),
                      "user",
                      user == null
                          ? null
                          : hash("name", user.name(), "phone", user.phone()),
                      "productIds",
                      entry.getValue().stream().toList());
                })
            .toList();
    return Map.of("items", items, "total", items.size());
  }

  @DeleteMapping("/favorites/{userId}")
  public Map<String, Object> clearFavorites(@PathVariable String userId) {
    favoritesStore.idsFor(userId).clear();
    return Map.of("ok", true);
  }

  // -------------------------------------------------------------- chat

  @GetMapping("/chat/messages")
  public Map<String, Object> chatMessages() {
    List<Map<String, Object>> items =
        chatHistory.all().stream()
            .map(
                record ->
                    hash(
                        "id", record.id(),
                        "at", record.at(),
                        "userId", record.userId(),
                        "message", record.message(),
                        "reply", record.reply()))
            .toList();
    return Map.of("items", items, "total", items.size());
  }

  @DeleteMapping("/chat/messages")
  public Map<String, Object> clearChat() {
    chatHistory.clear();
    return Map.of("ok", true);
  }
}
