package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.List;

/**
 * A product as crawled from the IKEA catalog API. Catalog-category products and
 * product-detail-page products share this shape.
 */
public record Product(
    String id,
    String slug,
    String name,
    String productType,
    String designText,
    BigDecimal price,
    BigDecimal originalPrice,
    String image,
    List<JsonNode> labels,
    JsonNode detail) {}
