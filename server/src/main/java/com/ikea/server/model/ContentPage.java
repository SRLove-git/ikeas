package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/** A content/landing page (rooms, ideas, campaigns, customer service, ...). */
public record ContentPage(
    String url,
    String family,
    String id,
    String title,
    String name,
    String hero,
    List<JsonNode> blocks) {}
