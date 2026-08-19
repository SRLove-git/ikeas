package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.entity.SiteSettingEntity;
import com.ikea.server.mapper.SiteSettingEntityMapper;
import java.io.InputStream;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Database-backed site settings used by the admin settings page. */
@Service
public class AdminSettingsService {

  private final ObjectMapper mapper;
  private final SiteSettingEntityMapper settingMapper;

  public AdminSettingsService(ObjectMapper mapper, SiteSettingEntityMapper settingMapper) {
    this.mapper = mapper;
    this.settingMapper = settingMapper;
  }

  public JsonNode get() {
    SiteSettingEntity entity = findSingleton();
    if (entity != null) {
      return readPayload(entity.getPayload());
    }
    return readDefault();
  }

  @Transactional
  public JsonNode update(JsonNode settings) {
    if (settings == null || !settings.isObject()) {
      throw new IllegalArgumentException("网站设置必须是 JSON 对象");
    }

    SiteSettingEntity entity = findSingleton();
    if (entity == null) {
      entity = new SiteSettingEntity();
      entity.setSingletonKey(1);
      entity.setPayload(writeValue(settings));
      settingMapper.insert(entity);
    } else {
      entity.setPayload(writeValue(settings));
      settingMapper.updateById(entity);
    }
    return settings;
  }

  private SiteSettingEntity findSingleton() {
    return settingMapper.selectOne(
        Wrappers.lambdaQuery(SiteSettingEntity.class)
            .eq(SiteSettingEntity::getSingletonKey, 1)
            .last("limit 1"));
  }

  private JsonNode readDefault() {
    try (InputStream in = new ClassPathResource("data/settings.json").getInputStream()) {
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
      throw new IllegalArgumentException("网站设置序列化失败", ex);
    }
  }
}
