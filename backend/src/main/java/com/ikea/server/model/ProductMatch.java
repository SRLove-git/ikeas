package com.ikea.server.model;

/** The result of resolving a product, mirroring lib/catalog.findProductBySlug. */
public record ProductMatch(Product product, CategoryRef category) {}
