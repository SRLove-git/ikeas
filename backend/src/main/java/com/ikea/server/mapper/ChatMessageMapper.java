package com.ikea.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ikea.server.entity.ChatMessageEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ChatMessageMapper extends BaseMapper<ChatMessageEntity> {

  @Update("update chat_message set deleted = 1, updated_at = now() where deleted = 0")
  int logicDeleteAll();
}
