package com.ikea.server.integration.oms;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OMS 集成装配（对接规范 §4.1 / §8.2）：
 * 开关关闭（默认）时只装配 {@link DisabledOmsChannel}，不加载任何 OMS 组件；
 * 开启时强校验配置（fail-fast）并装配真实通道。
 */
@Configuration
@EnableConfigurationProperties(OmsProperties.class)
public class OmsIntegrationConfig {

  @Bean
  @ConditionalOnProperty(name = "ikea.oms.enabled", havingValue = "false", matchIfMissing = true)
  public OmsChannel disabledOmsChannel() {
    return new DisabledOmsChannel();
  }

  @Bean
  @ConditionalOnProperty(name = "ikea.oms.enabled", havingValue = "true")
  public OmsChannel omsOpenApiChannel(OmsProperties properties, ObjectMapper mapper) {
    properties.validate();
    return new OmsOpenApiChannel(properties, new OmsHttpClient(properties, mapper));
  }
}
