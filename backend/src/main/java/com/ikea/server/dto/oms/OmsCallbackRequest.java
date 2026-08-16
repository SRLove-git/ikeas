package com.ikea.server.dto.oms;

public record OmsCallbackRequest(
    String eventType,
    String orderNo,
    String externalOrderNo,
    Integer status,
    String returnNo,
    Integer afterSaleStatus) {}
