package com.ikea.server.data;

import com.fasterxml.jackson.databind.ObjectMapper;
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
  private final Path externalFile;
  private volatile Knowledge cached;
  private volatile long cachedMtime = -1;
  private volatile long cachedSize = -1;

  public ChatKnowledgeStore(
      ObjectMapper mapper, @Value("${ikea.chat-knowledge.file:}") String externalFile) {
    this.mapper = mapper;
    this.externalFile =
        externalFile == null || externalFile.isBlank() ? null : Path.of(externalFile).toAbsolutePath().normalize();
  }

  public Knowledge load() {
    if (externalFile == null) {
      Knowledge knowledge = cached;
      if (knowledge == null) {
        knowledge = readResource();
        cached = knowledge;
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

  private Knowledge readResource() {
    try (InputStream in = new ClassPathResource("data/chat-knowledge.json").getInputStream()) {
      return mapper.readValue(in, Knowledge.class);
    } catch (IOException ex) {
      log.warn("Failed to read bundled chat knowledge base: {}", ex.getMessage());
      return new Knowledge(List.of(), "");
    }
  }
}
