package com.ikea.server.dto.oms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** OMS SKU 映射新增/更新请求（productId 为 BUZUD 商品 ID）。 */
public record OmsSkuMappingUpsertRequest(
    @NotBlank(message = "productId 不能为空") String productId,
    @NotNull(message = "omsSkuId 不能为空") @Positive(message = "omsSkuId 必须为正整数")
        Long omsSkuId,
    @Size(max = 64, message = "omsSkuNo 不能超过 64 位") String omsSkuNo) {}
