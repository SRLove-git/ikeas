package com.ikea.server.test;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;

/** 纯单元测试中初始化 MyBatis-Plus 表元数据，供 Lambda Wrapper 解析列名。 */
public final class MybatisTestSupport {

  private MybatisTestSupport() {}

  public static void initTableInfo(Class<?> entityClass) {
    MybatisConfiguration configuration = new MybatisConfiguration();
    MapperBuilderAssistant assistant = new MapperBuilderAssistant(configuration, "test");
    assistant.setCurrentNamespace(entityClass.getName());
    TableInfoHelper.initTableInfo(assistant, entityClass);
  }
}
