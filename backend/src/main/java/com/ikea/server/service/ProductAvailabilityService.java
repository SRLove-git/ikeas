package com.ikea.server.service;

import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsSkuMappingService;
import com.ikea.server.model.Product;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;

/** Resolves whether a catalog product can enter the checkout flow. */
@Service
public class ProductAvailabilityService {

  public static final String AVAILABLE = "AVAILABLE";
  public static final String PRICE_UNAVAILABLE = "PRICE_UNAVAILABLE";
  public static final String OMS_SKU_UNMAPPED = "OMS_SKU_UNMAPPED";
  public static final String OMS_SNAPSHOT_UNAVAILABLE = "OMS_SNAPSHOT_UNAVAILABLE";
  public static final String OUT_OF_STOCK = "OUT_OF_STOCK";

  /** Public storefront response: do not expose internal OMS topology or exact stock. */
  public record Availability(boolean sellable, String reason, BigDecimal price) {}

  private final OmsChannel omsChannel;
  private final OmsSkuMappingService mappingService;

  public ProductAvailabilityService(
      OmsChannel omsChannel, OmsSkuMappingService mappingService) {
    this.omsChannel = omsChannel;
    this.mappingService = mappingService;
  }

  public Availability availability(Product product) {
    if (product == null) {
      throw new IllegalArgumentException("商品不能为空");
    }

    boolean omsEnabled = omsChannel.isEnabled();
    if (!omsEnabled) {
      BigDecimal localPrice = product.price();
      return localPrice == null || localPrice.signum() <= 0
          ? new Availability(false, PRICE_UNAVAILABLE, localPrice)
          : new Availability(true, AVAILABLE, localPrice);
    }
    OmsSkuMapping mapping =
        product.id() == null ? null : mappingService.getByProductId(product.id());
    boolean mapped = mapping != null && mapping.getOmsSkuId() != null;
    BigDecimal price =
        mapped && mapping.getSyncPrice() != null ? mapping.getSyncPrice() : product.price();

    if (!mapped) {
      return new Availability(false, OMS_SKU_UNMAPPED, price);
    }
    if (mapping.getLastSyncAt() == null
        || mapping.getSyncPrice() == null
        || mapping.getSyncStock() == null) {
      return new Availability(false, OMS_SNAPSHOT_UNAVAILABLE, price);
    }
    if (price == null || price.signum() <= 0) {
      return new Availability(false, PRICE_UNAVAILABLE, price);
    }
    if (mapping.getSyncStock() <= 0) {
      return new Availability(false, OUT_OF_STOCK, price);
    }
    return new Availability(true, AVAILABLE, price);
  }

  /** Returns a product copy priced from the same availability snapshot shown to the buyer. */
  public Product withEffectivePrice(Product product, Availability availability) {
    if (product == null || availability == null || availability.price() == null) {
      return product;
    }
    return new Product(
        product.id(),
        product.slug(),
        product.name(),
        product.productType(),
        product.designText(),
        availability.price(),
        product.originalPrice(),
        product.image(),
        product.labels(),
        product.detail(),
        product.categoryNames());
  }
}
