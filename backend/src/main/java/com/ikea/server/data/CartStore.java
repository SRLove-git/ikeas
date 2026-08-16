package com.ikea.server.data;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.entity.CartItemEntity;
import com.ikea.server.mapper.CartItemMapper;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Per-user shopping bag, persisted in PostgreSQL via MyBatis-Plus. */
@Component
public class CartStore {

  public record CartEntry(int quantity, long addedAt) {}

  private final CartItemMapper cartItemMapper;

  public CartStore(CartItemMapper cartItemMapper) {
    this.cartItemMapper = cartItemMapper;
  }

  @Transactional(readOnly = true)
  public LinkedHashMap<String, CartEntry> cartFor(String userId) {
    Long parsedUserId = parseUserId(userId);
    LinkedHashMap<String, CartEntry> cart = new LinkedHashMap<>();
    if (parsedUserId == null) {
      return cart;
    }
    for (CartItemEntity item :
        cartItemMapper.selectList(
            Wrappers.lambdaQuery(CartItemEntity.class)
                .eq(CartItemEntity::getUserId, parsedUserId)
                .orderByAsc(CartItemEntity::getAddedAt)
                .orderByAsc(CartItemEntity::getId))) {
      cart.put(item.getProductId(), new CartEntry(item.getQuantity(), toEpochMilli(item.getAddedAt())));
    }
    return cart;
  }

  @Transactional
  public void add(String userId, String productId, int quantity) {
    Long parsedUserId = requireUserId(userId);
    if (productId == null || productId.isBlank()) {
      throw new IllegalArgumentException("商品不能为空");
    }
    int qty = Math.max(1, Math.min(quantity, 99));
    CartItemEntity item =
        cartItemMapper.selectOne(
            Wrappers.lambdaQuery(CartItemEntity.class)
                .eq(CartItemEntity::getUserId, parsedUserId)
                .eq(CartItemEntity::getProductId, productId));
    if (item == null) {
      CartItemEntity created = new CartItemEntity();
      created.setUserId(parsedUserId);
      created.setProductId(productId);
      created.setQuantity(qty);
      created.setAddedAt(nowUtc());
      cartItemMapper.insert(created);
      return;
    }
    item.setQuantity(Math.min(99, item.getQuantity() + qty));
    item.setAddedAt(nowUtc());
    cartItemMapper.updateById(item);
  }

  @Transactional
  public void setQuantity(String userId, String productId, int quantity) {
    Long parsedUserId = requireUserId(userId);
    if (productId == null || productId.isBlank()) {
      return;
    }
    if (quantity <= 0) {
      remove(parsedUserId, productId);
      return;
    }

    int qty = Math.min(quantity, 99);
    CartItemEntity item =
        cartItemMapper.selectOne(
            Wrappers.lambdaQuery(CartItemEntity.class)
                .eq(CartItemEntity::getUserId, parsedUserId)
                .eq(CartItemEntity::getProductId, productId));
    if (item == null) {
      CartItemEntity created = new CartItemEntity();
      created.setUserId(parsedUserId);
      created.setProductId(productId);
      created.setQuantity(qty);
      created.setAddedAt(nowUtc());
      cartItemMapper.insert(created);
      return;
    }
    item.setQuantity(qty);
    item.setAddedAt(nowUtc());
    cartItemMapper.updateById(item);
  }

  @Transactional
  public void remove(String userId, String productId) {
    Long parsedUserId = parseUserId(userId);
    if (parsedUserId == null || productId == null || productId.isBlank()) {
      return;
    }
    remove(parsedUserId, productId);
  }

  @Transactional
  public void clear(String userId) {
    Long parsedUserId = parseUserId(userId);
    if (parsedUserId == null) {
      return;
    }
    cartItemMapper.delete(
        Wrappers.lambdaQuery(CartItemEntity.class)
            .eq(CartItemEntity::getUserId, parsedUserId));
  }

  /** All non-empty carts, newest first (used by the admin panel). */
  @Transactional(readOnly = true)
  public List<Map.Entry<String, LinkedHashMap<String, CartEntry>>> allCarts() {
    List<CartItemEntity> items =
        cartItemMapper.selectList(
            Wrappers.lambdaQuery(CartItemEntity.class)
                .orderByDesc(CartItemEntity::getAddedAt)
                .orderByDesc(CartItemEntity::getId));
    LinkedHashMap<String, LinkedHashMap<String, CartEntry>> grouped = new LinkedHashMap<>();
    for (CartItemEntity item : items) {
      String userId = String.valueOf(item.getUserId());
      grouped
          .computeIfAbsent(userId, ignored -> new LinkedHashMap<>())
          .putIfAbsent(
              item.getProductId(),
              new CartEntry(item.getQuantity(), toEpochMilli(item.getAddedAt())));
    }
    return new ArrayList<>(grouped.entrySet());
  }

  private void remove(Long userId, String productId) {
    cartItemMapper.delete(
        Wrappers.lambdaQuery(CartItemEntity.class)
            .eq(CartItemEntity::getUserId, userId)
            .eq(CartItemEntity::getProductId, productId));
  }

  private static Long requireUserId(String userId) {
    Long parsed = parseUserId(userId);
    if (parsed == null) {
      throw new IllegalArgumentException("购物袋用户无效");
    }
    return parsed;
  }

  private static Long parseUserId(String userId) {
    if (userId == null || userId.isBlank()) {
      return null;
    }
    try {
      return Long.valueOf(userId);
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  private static LocalDateTime nowUtc() {
    return LocalDateTime.now(ZoneOffset.UTC);
  }

  private static long toEpochMilli(LocalDateTime value) {
    return value == null ? 0L : value.toInstant(ZoneOffset.UTC).toEpochMilli();
  }
}
