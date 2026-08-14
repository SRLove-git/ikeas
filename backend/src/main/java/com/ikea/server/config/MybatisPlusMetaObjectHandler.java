package com.ikea.server.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

/** 自动填充 created_at / updated_at。 */
@Component
public class MybatisPlusMetaObjectHandler implements MetaObjectHandler {

  @Override
  public void insertFill(MetaObject metaObject) {
    LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
    strictInsertFill(metaObject, "createdAt", LocalDateTime.class, now);
    strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, now);
  }

  @Override
  public void updateFill(MetaObject metaObject) {
    strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now(ZoneOffset.UTC));
  }
}
