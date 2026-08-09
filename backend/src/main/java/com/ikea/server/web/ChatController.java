package com.ikea.server.web;

import com.ikea.server.data.ChatHistoryStore;
import com.ikea.server.data.ChatKnowledgeStore;
import java.util.List;
import java.util.Locale;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Simple canned customer-service chat used by the floating chat widget. */
@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

  public record ChatMessage(String message) {}

  public record ChatReply(String reply) {}

  private final ChatHistoryStore chatHistory;
  private final ChatKnowledgeStore knowledgeStore;

  public ChatController(ChatHistoryStore chatHistory, ChatKnowledgeStore knowledgeStore) {
    this.chatHistory = chatHistory;
    this.knowledgeStore = knowledgeStore;
  }

  @PostMapping("/messages")
  public ChatReply reply(@RequestBody ChatMessage message) {
    String text = message.message() == null ? "" : message.message().toLowerCase(Locale.ROOT);
    ChatKnowledgeStore.Knowledge knowledge = knowledgeStore.load();
    String reply =
        knowledge.rules().stream()
            .filter(rule -> rule.keywords() != null
                && rule.keywords().stream().anyMatch(keyword -> keyword != null && text.contains(keyword.toLowerCase(Locale.ROOT))))
            .map(ChatKnowledgeStore.Rule::reply)
            .findFirst()
            .orElseGet(() -> knowledge.defaultReply());
    chatHistory.record(null, message.message(), reply);
    return new ChatReply(reply);
  }
}
