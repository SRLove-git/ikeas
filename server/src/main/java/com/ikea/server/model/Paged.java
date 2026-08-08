package com.ikea.server.model;

import java.util.List;

public record Paged<T>(List<T> items, long total, int page, int size, int totalPages) {

  public static <T> Paged<T> of(List<T> source, int page, int size) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), 1000);
    int from = Math.min(safePage * safeSize, source.size());
    int to = Math.min(from + safeSize, source.size());
    int totalPages = (int) Math.ceil(source.size() / (double) safeSize);
    return new Paged<>(
        List.copyOf(source.subList(from, to)),
        source.size(),
        safePage,
        safeSize,
        totalPages);
  }
}
