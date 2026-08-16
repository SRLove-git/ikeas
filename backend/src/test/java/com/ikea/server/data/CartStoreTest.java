package com.ikea.server.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.data.CartStore.CartEntry;
import com.ikea.server.entity.CartItemEntity;
import com.ikea.server.mapper.CartItemMapper;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CartStoreTest {

  private CartItemMapper cartItemMapper;
  private CartStore cartStore;

  @BeforeEach
  void setUp() {
    cartItemMapper = org.mockito.Mockito.mock(CartItemMapper.class);
    cartStore = new CartStore(cartItemMapper);
  }

  @Test
  void cartForShouldReturnProductIdsInStoredOrder() {
    when(cartItemMapper.selectList(any(Wrapper.class)))
        .thenReturn(
            List.of(
                item("P1", 2, "2026-08-15T00:00:00"),
                item("P2", 3, "2026-08-15T00:00:01")));

    var cart = cartStore.cartFor("1");

    assertEquals(2, cart.size());
    assertEquals(2, cart.get("P1").quantity());
    assertEquals(3, cart.get("P2").quantity());
  }

  @Test
  void addShouldUpdateExistingItemQuantity() {
    CartItemEntity existing = item("P1", 2, "2026-08-15T00:00:00");
    when(cartItemMapper.selectOne(any(Wrapper.class))).thenReturn(existing);

    cartStore.add("1", "P1", 3);

    assertEquals(5, existing.getQuantity());
    verify(cartItemMapper).updateById(existing);
  }

  @Test
  void setQuantityShouldRemoveWhenQuantityIsZero() {
    cartStore.setQuantity("1", "P1", 0);

    verify(cartItemMapper).delete(any(Wrapper.class));
  }

  @Test
  void clearShouldDeleteOnlyCurrentUser() {
    cartStore.clear("1");

    verify(cartItemMapper).delete(any(Wrapper.class));
  }

  @Test
  void allCartsShouldGroupItemsByUser() {
    CartItemEntity first = item("P1", 2, "2026-08-15T00:00:00");
    first.setUserId(1L);
    CartItemEntity second = item("P2", 1, "2026-08-15T00:00:01");
    second.setUserId(1L);
    CartItemEntity third = item("P1", 4, "2026-08-15T00:00:02");
    third.setUserId(2L);
    when(cartItemMapper.selectList(any(Wrapper.class)))
        .thenReturn(List.of(third, second, first));

    var carts = cartStore.allCarts();

    assertEquals(2, carts.size());
    assertEquals("2", carts.get(0).getKey());
    assertEquals("1", carts.get(1).getKey());
  }

  private static CartItemEntity item(String productId, int quantity, String addedAt) {
    CartItemEntity item = new CartItemEntity();
    item.setId((long) productId.hashCode());
    item.setUserId(1L);
    item.setProductId(productId);
    item.setQuantity(quantity);
    item.setAddedAt(LocalDateTime.parse(addedAt).toInstant(ZoneOffset.UTC).atZone(ZoneOffset.UTC).toLocalDateTime());
    return item;
  }
}
