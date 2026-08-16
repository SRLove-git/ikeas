package com.ikea.server.data;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.entity.ChatMessageEntity;
import com.ikea.server.mapper.ChatMessageMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Customer-service chat Q&A history, persisted in PostgreSQL. */
@Component
public class ChatHistoryStore {

  private static final int MAX_HISTORY = 500;

  public record ChatRecord(
      String id, String at, String userId, String message, String reply) {}

  private final ChatMessageMapper chatMessageMapper;

  public ChatHistoryStore(ChatMessageMapper chatMessageMapper) {
    this.chatMessageMapper = chatMessageMapper;
  }

  @Transactional
  public void record(String userId, String message, String reply) {
    ChatMessageEntity entity = new ChatMessageEntity();
    entity.setUserId(parseUserId(userId));
    entity.setMessage(message == null ? "" : message);
    entity.setReply(reply == null ? "" : reply);
    chatMessageMapper.insert(entity);
    trimHistory();
  }

  @Transactional(readOnly = true)
  public List<ChatRecord> all() {
    List<ChatRecord> records = new ArrayList<>();
    for (ChatMessageEntity entity :
        chatMessageMapper.selectList(
            Wrappers.lambdaQuery(ChatMessageEntity.class)
                .orderByDesc(ChatMessageEntity::getCreatedAt)
                .orderByDesc(ChatMessageEntity::getId))) {
      records.add(
          new ChatRecord(
              entity.getId() == null ? null : entity.getId().toString(),
              entity.getCreatedAt() == null ? null : entity.getCreatedAt().toString(),
              entity.getUserId() == null ? null : entity.getUserId().toString(),
              entity.getMessage(),
              entity.getReply()));
    }
    return List.copyOf(records);
  }

  @Transactional
  public void clear() {
    chatMessageMapper.logicDeleteAll();
  }

  private void trimHistory() {
    Long count = chatMessageMapper.selectCount(null);
    if (count == null || count <= MAX_HISTORY) {
      return;
    }
    long overflow = count - MAX_HISTORY;
    List<ChatMessageEntity> oldest =
        chatMessageMapper.selectList(
            Wrappers.lambdaQuery(ChatMessageEntity.class)
                .orderByAsc(ChatMessageEntity::getCreatedAt)
                .orderByAsc(ChatMessageEntity::getId)
                .last("limit " + overflow));
    for (ChatMessageEntity entity : oldest) {
      chatMessageMapper.deleteById(entity.getId());
    }
  }

  private static Long parseUserId(String userId) {
    if (userId == null || userId.isBlank()) {
      return null;
    }
    try {
      return Long.valueOf(userId);
    } catch (NumberFormatException ex) {
      return null;
    }
  }
}
