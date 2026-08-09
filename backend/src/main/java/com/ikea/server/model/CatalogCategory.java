package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record CatalogCategory(
    String id,
    String name,
    String slug,
    String url,
    String image,
    List<JsonNode> subs,
    List<Product> products) {}
