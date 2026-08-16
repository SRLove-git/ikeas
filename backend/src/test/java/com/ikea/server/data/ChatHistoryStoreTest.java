package com.ikea.server.data;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.entity.ChatMessageEntity;
import com.ikea.server.mapper.ChatMessageMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ChatHistoryStoreTest {

  private ChatMessageMapper chatMessageMapper;
  private ChatHistoryStore chatHistoryStore;

  @BeforeEach
  void setUp() {
    chatMessageMapper = org.mockito.Mockito.mock(ChatMessageMapper.class);
    chatHistoryStore = new ChatHistoryStore(chatMessageMapper);
  }

  @Test
  void recordShouldPersistMessageAndReply() {
    when(chatMessageMapper.selectCount(null)).thenReturn(1L);

    chatHistoryStore.record(null, "配送", "回复");

    ArgumentCaptor<ChatMessageEntity> captor = ArgumentCaptor.forClass(ChatMessageEntity.class);
    verify(chatMessageMapper).insert(captor.capture());
    assertEquals("配送", captor.getValue().getMessage());
    assertEquals("回复", captor.getValue().getReply());
    assertNull(captor.getValue().getUserId());
  }

  @Test
  void allShouldMapNewestFirst() {
    ChatMessageEntity older = entity("1", "配送", "回复1");
    ChatMessageEntity newer = entity("2", "售后", "回复2");
    when(chatMessageMapper.selectList(any(Wrapper.class))).thenReturn(List.of(newer, older));

    var records = chatHistoryStore.all();

    assertEquals(2, records.size());
    assertEquals("2", records.get(0).id());
    assertEquals("1", records.get(1).id());
  }

  @Test
  void clearShouldLogicDeleteAllMessages() {
    chatHistoryStore.clear();

    verify(chatMessageMapper).logicDeleteAll();
  }

  private static ChatMessageEntity entity(String id, String message, String reply) {
    ChatMessageEntity entity = new ChatMessageEntity();
    entity.setId(Long.valueOf(id));
    entity.setMessage(message);
    entity.setReply(reply);
    return entity;
  }
}
