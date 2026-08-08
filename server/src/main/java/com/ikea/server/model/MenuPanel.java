package com.ikea.server.model;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

/** Header mega-menu hover panel from src/data/menu-panels.ts. */
public record MenuPanel(String label, String href, List<JsonNode> blocks) {}
