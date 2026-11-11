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
  public static final String OUT_OF_STOCK = "OUT_OF_STOCK";

  public record Availability(
      boolean sellable,
      String reason,
      BigDecimal price,
      Integer stock,
      boolean omsEnabled,
      boolean mapped) {}

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
    OmsSkuMapping mapping =
        product.id() == null ? null : mappingService.getByProductId(product.id());
    boolean mapped = mapping != null && mapping.getOmsSkuId() != null;
    BigDecimal price =
        mapped && mapping.getSyncPrice() != null ? mapping.getSyncPrice() : product.price();
    Integer stock = mapped ? mapping.getSyncStock() : null;

    if (price == null || price.signum() <= 0) {
      return new Availability(
          false, PRICE_UNAVAILABLE, price, stock, omsEnabled, mapped);
    }
    if (omsEnabled && !mapped) {
      return new Availability(
          false, OMS_SKU_UNMAPPED, price, null, true, false);
    }
    if (omsEnabled && stock != null && stock <= 0) {
      return new Availability(false, OUT_OF_STOCK, price, stock, true, true);
    }
    return new Availability(true, AVAILABLE, price, stock, omsEnabled, mapped);
  }
}
