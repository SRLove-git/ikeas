package com.ikea.server.data;

import java.time.OffsetDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** In-memory record of customer-service chat Q&A (used by the admin panel). */
@Component
public class ChatHistoryStore {

  public record ChatRecord(
      String id, String at, String userId, String message, String reply) {}

  private final Deque<ChatRecord> history = new ArrayDeque<>();

  public synchronized void record(String userId, String message, String reply) {
    history.addFirst(
        new ChatRecord(
            UUID.randomUUID().toString(),
            OffsetDateTime.now().toString(),
            userId,
            message == null ? "" : message,
            reply == null ? "" : reply));
    while (history.size() > 500) {
      history.removeLast();
    }
  }

  public synchronized List<ChatRecord> all() {
    return List.copyOf(history);
  }

  public synchronized void clear() {
    history.clear();
  }
}
