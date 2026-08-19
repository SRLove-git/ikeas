package com.ikea.server.data;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.entity.ChatKnowledgeEntity;
import com.ikea.server.mapper.ChatKnowledgeEntityMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Customer-service chat knowledge base. Loads from the bundled
 * classpath:data/chat-knowledge.json, or from an external JSON file
 * (IKEA_CHAT_KNOWLEDGE_FILE). External files are re-read when they change,
 * so the CMS panel's edits take effect without restarting the server.
 */
@Component
public class ChatKnowledgeStore {

  private static final Logger log = LoggerFactory.getLogger(ChatKnowledgeStore.class);

  public record Rule(String id, List<String> keywords, String reply) {}

  public record Knowledge(List<Rule> rules, String defaultReply) {
    public Knowledge {
      rules = rules == null ? List.of() : List.copyOf(rules);
      defaultReply = defaultReply == null ? "" : defaultReply;
    }
  }

  private final ObjectMapper mapper;
  private final ChatKnowledgeEntityMapper knowledgeMapper;
  private final Path externalFile;
  private volatile Knowledge cached;
  private volatile long cachedMtime = -1;
  private volatile long cachedSize = -1;

  public ChatKnowledgeStore(
      ObjectMapper mapper,
      ChatKnowledgeEntityMapper knowledgeMapper,
      @Value("${ikea.chat-knowledge.file:}") String externalFile) {
    this.mapper = mapper;
    this.knowledgeMapper = knowledgeMapper;
    this.externalFile =
        externalFile == null || externalFile.isBlank() ? null : Path.of(externalFile).toAbsolutePath().normalize();
  }

  public Knowledge load() {
    if (externalFile == null) {
      Knowledge databaseKnowledge = readDatabase();
      if (databaseKnowledge != null) {
        return databaseKnowledge;
      }
      Knowledge knowledge = cached;
      if (knowledge == null) {
        knowledge = readResource();
        cached = knowledge;
        seedDatabase(knowledge);
      }
      return knowledge;
    }
    try {
      if (!Files.isRegularFile(externalFile)) {
        Knowledge knowledge = cached;
        return knowledge == null ? readResource() : knowledge;
      }
      long mtime = Files.getLastModifiedTime(externalFile).toMillis();
      long size = Files.size(externalFile);
      if (mtime != cachedMtime || size != cachedSize) {
        Knowledge knowledge = mapper.readValue(externalFile.toFile(), Knowledge.class);
        cached = knowledge;
        cachedMtime = mtime;
        cachedSize = size;
        log.info("Reloaded chat knowledge base from {}", externalFile);
      }
      return cached;
    } catch (IOException ex) {
      log.warn("Failed to read chat knowledge file {}: {}", externalFile, ex.getMessage());
      Knowledge knowledge = cached;
      return knowledge == null ? readResource() : knowledge;
    }
  }

  private Knowledge readDatabase() {
    ChatKnowledgeEntity entity =
        knowledgeMapper.selectOne(
            Wrappers.lambdaQuery(ChatKnowledgeEntity.class)
                .eq(ChatKnowledgeEntity::getSingletonKey, 1)
                .last("limit 1"));
    if (entity == null) {
      return null;
    }
    try {
      return mapper.readValue(entity.getPayload(), Knowledge.class);
    } catch (IOException ex) {
      log.warn("Failed to read chat knowledge database payload: {}", ex.getMessage());
      return null;
    }
  }

  private void seedDatabase(Knowledge knowledge) {
    try {
      ChatKnowledgeEntity entity =
          knowledgeMapper.selectOne(
              Wrappers.lambdaQuery(ChatKnowledgeEntity.class)
                  .eq(ChatKnowledgeEntity::getSingletonKey, 1)
                  .last("limit 1"));
      if (entity == null) {
        entity = new ChatKnowledgeEntity();
        entity.setSingletonKey(1);
        entity.setPayload(mapper.writeValueAsString(knowledge));
        knowledgeMapper.insert(entity);
      } else {
        entity.setPayload(mapper.writeValueAsString(knowledge));
        knowledgeMapper.updateById(entity);
      }
    } catch (Exception ex) {
      log.warn("Failed to seed chat knowledge database: {}", ex.getMessage());
    }
  }

  private Knowledge readResource() {
    try (InputStream in = new ClassPathResource("data/chat-knowledge.json").getInputStream()) {
      return mapper.readValue(in, Knowledge.class);
    } catch (IOException ex) {
      log.warn("Failed to read bundled chat knowledge base: {}", ex.getMessage());
      return new Knowledge(List.of(), "");
    }
  }
}
