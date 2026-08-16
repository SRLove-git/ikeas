package com.ikea.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ikea.server.entity.CartItemEntity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CartItemMapper extends BaseMapper<CartItemEntity> {}
