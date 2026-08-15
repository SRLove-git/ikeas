package com.ikea.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ikea.server.entity.Order;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OrderMapper extends BaseMapper<Order> {}
