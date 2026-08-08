package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/** A category landing page crawled from the IKEA catalogs API (all.json). */
public record CatalogPage(
    String url,
    String id,
    String name,
    String description,
    Integer total,
    List<JsonNode> products,
    List<JsonNode> blocks,
    List<JsonNode> productIds) {}
