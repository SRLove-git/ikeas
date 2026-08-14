package com.ikea.server.web;

import com.ikea.server.data.CartStore;
import com.ikea.server.data.ChatHistoryStore;
import com.ikea.server.data.FavoritesStore;
import com.ikea.server.entity.AppUser;
import com.ikea.server.model.User;
import com.ikea.server.service.TokenService;
import com.ikea.server.service.UserService;
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

  private final UserService userService;
  private final TokenService tokenService;
  private final CartStore cartStore;
  private final FavoritesStore favoritesStore;
  private final ChatHistoryStore chatHistory;

  public AdminController(
      UserService userService,
      TokenService tokenService,
      CartStore cartStore,
      FavoritesStore favoritesStore,
      ChatHistoryStore chatHistory) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.cartStore = cartStore;
    this.favoritesStore = favoritesStore;
    this.chatHistory = chatHistory;
  }

  @GetMapping("/stats")
  public Map<String, Object> stats() {
    return Map.of(
        "users", userService.listAll().size(),
        "carts", cartStore.allCarts().size(),
        "favorites", favoritesStore.allFavorites().size(),
        "chatMessages", chatHistory.all().size());
  }

  // ------------------------------------------------------------- users

  @GetMapping("/users")
  public Map<String, Object> users() {
    List<User> items =
        userService.listAll().stream()
            .map(AdminController::toUser)
            .toList();
    return Map.of("items", items, "total", items.size());
  }

  @DeleteMapping("/users/{id}")
  public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String id) {
    Long userId = parseUserId(id);
    boolean removed = userId != null && userService.softDelete(userId);
    if (!removed) {
      return ResponseEntity.status(404).body(Map.of("error", "用户不存在"));
    }
    tokenService.revokeAllForUser(userId);
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
                  AppUser user =
                      userService.findById(parseUserId(entry.getKey())).orElse(null);
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
                          : hash("name", user.getName(), "phone", user.getPhone()),
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
                  AppUser user =
                      userService.findById(parseUserId(entry.getKey())).orElse(null);
                  return hash(
                      "userId",
                      entry.getKey(),
                      "user",
                      user == null
                          ? null
                          : hash("name", user.getName(), "phone", user.getPhone()),
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

  private static User toUser(AppUser user) {
    return new User(
        user.getId().toString(),
        user.getName() == null || user.getName().isBlank() ? user.getUsername() : user.getName(),
        user.getPhone(),
        user.getEmail(),
        user.getCreatedAt() == null ? null : user.getCreatedAt().toString());
  }

  private static Long parseUserId(String value) {
    if (value == null) {
      return null;
    }
    try {
      return Long.valueOf(value);
    } catch (NumberFormatException ex) {
      return null;
    }
  }
}
