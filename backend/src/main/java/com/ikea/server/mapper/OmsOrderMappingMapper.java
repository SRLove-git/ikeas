package com.ikea.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ikea.server.entity.OmsOrderMapping;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface OmsOrderMappingMapper extends BaseMapper<OmsOrderMapping> {

  @Select("SELECT * FROM oms_order_mapping WHERE oms_order_no = #{omsOrderNo} AND deleted = 0 LIMIT 1")
  OmsOrderMapping findByOmsOrderNo(@Param("omsOrderNo") String omsOrderNo);
}
