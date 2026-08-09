package com.ikea.server.web;

import com.ikea.server.data.CartStore;
import com.ikea.server.data.DataStore;
import com.ikea.server.model.Cart;
import com.ikea.server.model.CartItem;
import com.ikea.server.model.Product;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

  private final CartStore cartStore;
  private final DataStore dataStore;

  public CartController(CartStore cartStore, DataStore dataStore) {
    this.cartStore = cartStore;
    this.dataStore = dataStore;
  }

  public record AddItemRequest(String productId, Integer quantity) {}

  public record UpdateQuantityRequest(Integer quantity) {}

  @GetMapping
  public Cart cart(HttpServletRequest request) {
    return buildCart(userId(request));
  }

  @PostMapping("/items")
  public Cart addItem(HttpServletRequest request, @RequestBody AddItemRequest body) {
    Product product = requireProduct(body.productId());
    cartStore.add(userId(request), product.id(), body.quantity() == null ? 1 : body.quantity());
    return buildCart(userId(request));
  }

  @PatchMapping("/items/{productId}")
  public Cart updateQuantity(
      HttpServletRequest request,
      @PathVariable String productId,
      @RequestBody UpdateQuantityRequest body) {
    cartStore.setQuantity(
        userId(request), productId, body.quantity() == null ? 0 : body.quantity());
    return buildCart(userId(request));
  }

  @DeleteMapping("/items/{productId}")
  public Cart removeItem(HttpServletRequest request, @PathVariable String productId) {
    cartStore.remove(userId(request), productId);
    return buildCart(userId(request));
  }

  @DeleteMapping
  public Cart clear(HttpServletRequest request) {
    cartStore.clear(userId(request));
    return buildCart(userId(request));
  }

  private Cart buildCart(String userId) {
    List<CartItem> items = new ArrayList<>();
    int totalQuantity = 0;
    BigDecimal totalPrice = BigDecimal.ZERO;
    // CartStore exposes entries via cartFor(); re-read to keep types simple.
    var entries = cartStore.cartFor(userId);
    for (var entry : entries.entrySet()) {
      Product product = dataStore.findProductById(entry.getKey());
      if (product == null) {
        continue;
      }
      int quantity = entry.getValue().quantity();
      items.add(new CartItem(entry.getKey(), quantity, product));
      totalQuantity += quantity;
      if (product.price() != null) {
        totalPrice =
            totalPrice.add(product.price().multiply(BigDecimal.valueOf(quantity)));
      }
    }
    return new Cart(items, totalQuantity, totalPrice);
  }

  private Product requireProduct(String productId) {
    Product product = dataStore.findProductById(productId);
    if (product == null) {
      throw new ResourceNotFoundException("Product not found: " + productId);
    }
    return product;
  }

  private static String userId(HttpServletRequest request) {
    return (String) request.getAttribute(AuthInterceptor.USER_ID_ATTRIBUTE);
  }
}
