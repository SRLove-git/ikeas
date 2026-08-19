package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.ikea.server.service.AdminChangelogService;
import com.ikea.server.service.AdminChatKnowledgeService;
import com.ikea.server.service.AdminSettingsService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin endpoints for site settings, changelog and chat knowledge. */
@RestController
@RequestMapping({"/api/v1/admin", "/api/admin"})
public class AdminMetaController {

  private final AdminSettingsService settingsService;
  private final AdminChangelogService changelogService;
  private final AdminChatKnowledgeService chatKnowledgeService;

  public AdminMetaController(
      AdminSettingsService settingsService,
      AdminChangelogService changelogService,
      AdminChatKnowledgeService chatKnowledgeService) {
    this.settingsService = settingsService;
    this.changelogService = changelogService;
    this.chatKnowledgeService = chatKnowledgeService;
  }

  @GetMapping("/settings")
  public JsonNode settings() {
    return settingsService.get();
  }

  @PutMapping("/settings")
  public JsonNode updateSettings(@RequestBody JsonNode body) {
    return settingsService.update(body);
  }

  @GetMapping("/changelog")
  public Map<String, JsonNode> changelog() {
    return Map.of("items", changelogService.list());
  }

  @GetMapping("/chat-knowledge")
  public JsonNode chatKnowledge() {
    return chatKnowledgeService.get();
  }

  @PutMapping("/chat-knowledge")
  public JsonNode updateChatKnowledge(@RequestBody JsonNode body) {
    return chatKnowledgeService.update(body);
  }
}
