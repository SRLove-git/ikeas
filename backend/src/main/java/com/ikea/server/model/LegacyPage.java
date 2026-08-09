package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/** Legacy page shape from src/data/pages.ts (heading/text/image sections). */
public record LegacyPage(
    String url,
    String family,
    String title,
    String h1,
    String hero,
    List<JsonNode> sections,
    List<String> links) {}
