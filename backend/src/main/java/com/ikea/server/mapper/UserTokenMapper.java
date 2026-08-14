package com.ikea.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ikea.server.entity.UserToken;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserTokenMapper extends BaseMapper<UserToken> {}
