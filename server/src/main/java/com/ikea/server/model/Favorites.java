package com.ikea.server.model;

import java.util.List;

public record Favorites(List<Product> items, List<String> ids) {}
