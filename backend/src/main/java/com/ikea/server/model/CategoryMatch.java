package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;

/** The result of resolving a category slug, mirroring lib/catalog.findCategoryBySlug. */
public record CategoryMatch(CatalogCategory category, JsonNode sub) {}
