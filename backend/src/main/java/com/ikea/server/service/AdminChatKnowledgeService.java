package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.entity.ChatKnowledgeEntity;
import com.ikea.server.mapper.ChatKnowledgeEntityMapper;
import java.io.InputStream;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Database-backed customer-service chat knowledge base. */
@Service
public class AdminChatKnowledgeService {

  private final ObjectMapper mapper;
  private final ChatKnowledgeEntityMapper knowledgeMapper;

  public AdminChatKnowledgeService(
      ObjectMapper mapper, ChatKnowledgeEntityMapper knowledgeMapper) {
    this.mapper = mapper;
    this.knowledgeMapper = knowledgeMapper;
  }

  public JsonNode get() {
    ChatKnowledgeEntity entity = findSingleton();
    if (entity != null) {
      return readPayload(entity.getPayload());
    }
    return readDefault();
  }

  @Transactional
  public JsonNode update(JsonNode knowledge) {
    if (knowledge == null || !knowledge.isObject()) {
      throw new IllegalArgumentException("客服知识库必须是 JSON 对象");
    }

    ChatKnowledgeEntity entity = findSingleton();
    if (entity == null) {
      entity = new ChatKnowledgeEntity();
      entity.setSingletonKey(1);
      entity.setPayload(writeValue(knowledge));
      knowledgeMapper.insert(entity);
    } else {
      entity.setPayload(writeValue(knowledge));
      knowledgeMapper.updateById(entity);
    }
    return knowledge;
  }

  private ChatKnowledgeEntity findSingleton() {
    return knowledgeMapper.selectOne(
        Wrappers.lambdaQuery(ChatKnowledgeEntity.class)
            .eq(ChatKnowledgeEntity::getSingletonKey, 1)
            .last("limit 1"));
  }

  private JsonNode readDefault() {
    try (InputStream in = new ClassPathResource("data/chat-knowledge.json").getInputStream()) {
      return mapper.readTree(in);
    } catch (Exception ex) {
      return mapper.createObjectNode();
    }
  }

  private JsonNode readPayload(String payload) {
    try {
      return mapper.readTree(payload);
    } catch (Exception ex) {
      return mapper.createObjectNode();
    }
  }

  private String writeValue(JsonNode value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (Exception ex) {
      throw new IllegalArgumentException("客服知识库序列化失败", ex);
    }
  }
}
