package com.ikea.server.dto.content;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** DTOs for the CMS content endpoints (pages, homepage and header menus). */
public final class ContentAdminDtos {

  private ContentAdminDtos() {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record PageUpsertRequest(
      @NotBlank(message = "页面 URL 不能为空") String url,
      @NotBlank(message = "页面栏目不能为空") String family,
      String id,
      @NotBlank(message = "页面标题不能为空") String title,
      String name,
      String hero,
      String subtitle,
      @NotNull(message = "页面区块不能为空") List<JsonNode> blocks) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record HomepageUpdateRequest(@NotNull(message = "缺少 updates") JsonNode updates) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record MenuUpdateRequest(JsonNode menuPanels, JsonNode menuCategories) {}
}
