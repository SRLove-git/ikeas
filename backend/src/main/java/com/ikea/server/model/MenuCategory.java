package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/** Navigation categories extracted from src/data/categories.ts. */
public record MenuCategory(
    String name, String url, String image, List<JsonNode> subs) {}
