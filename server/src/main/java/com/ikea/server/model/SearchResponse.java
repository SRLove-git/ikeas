package com.ikea.server.model;

import java.util.List;

public record SearchResponse(
    String query,
    List<Product> products,
    List<ContentPage> pages,
    List<CatalogPage> catalogPages) {}
