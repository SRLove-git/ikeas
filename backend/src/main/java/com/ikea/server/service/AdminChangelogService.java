package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ikea.server.entity.ChangelogEntryEntity;
import com.ikea.server.mapper.ChangelogEntryEntityMapper;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Changelog storage for the admin dashboard. */
@Service
public class AdminChangelogService {

  private static final DateTimeFormatter ISO =
      DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

  private final ObjectMapper mapper;
  private final ChangelogEntryEntityMapper changelogMapper;

  public AdminChangelogService(
      ObjectMapper mapper, ChangelogEntryEntityMapper changelogMapper) {
    this.mapper = mapper;
    this.changelogMapper = changelogMapper;
  }

  public JsonNode list() {
    ArrayNode items = mapper.createArrayNode();
    for (ChangelogEntryEntity entity :
        changelogMapper.selectList(
            Wrappers.lambdaQuery(ChangelogEntryEntity.class)
                .orderByDesc(ChangelogEntryEntity::getCreatedAt)
                .orderByDesc(ChangelogEntryEntity::getId)
                .last("limit 200"))) {
      ObjectNode item = mapper.createObjectNode();
      item.put("id", entity.getEntryId());
      item.put("at", entity.getCreatedAt() == null ? nowIso() : format(entity.getCreatedAt()));
      item.put("user", entity.getUserName());
      item.put("action", entity.getAction());
      item.put("resource", entity.getResource());
      item.put("target", entity.getTarget());
      item.put("summary", entity.getSummary());
      items.add(item);
    }
    return items;
  }

  @Transactional
  public void append(String user, String action, String resource, String target, String summary) {
    ChangelogEntryEntity entity = new ChangelogEntryEntity();
    entity.setEntryId(UUID.randomUUID().toString());
    entity.setUserName(user == null || user.isBlank() ? "admin" : user);
    entity.setAction(action == null ? "update" : action);
    entity.setResource(resource);
    entity.setTarget(target);
    entity.setSummary(summary);
    entity.setPayload("{}");
    changelogMapper.insert(entity);
  }

  private static String format(LocalDateTime value) {
    return value.atOffset(ZoneOffset.UTC).format(ISO);
  }

  private static String nowIso() {
    return LocalDateTime.now(ZoneOffset.UTC).atOffset(ZoneOffset.UTC).format(ISO);
  }
}
