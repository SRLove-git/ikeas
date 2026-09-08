package com.ikea.server.config;

import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Snowflake-assigned Long IDs exceed JavaScript's Number.MAX_SAFE_INTEGER,
 * so serializing them as JSON numbers would lose precision in the browser.
 * Serialize Long/long values as strings instead, which keeps IDs intact
 * when the frontend round-trips them through URLs and request bodies.
 */
@Configuration
public class JacksonConfig {

  @Bean
  public Jackson2ObjectMapperBuilderCustomizer longToStringCustomizer() {
    return builder -> {
      builder.serializerByType(Long.class, ToStringSerializer.instance);
      builder.serializerByType(Long.TYPE, ToStringSerializer.instance);
    };
  }
}
