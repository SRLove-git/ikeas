package com.ikea.server.dto.oms;

/** OMS → 商城回调报文信封：eventId 为幂等键，data 承载事件明细。 */
public record OmsCallbackRequest(
    String eventId,
    String event,
    String appId,
    String timestamp,
    OmsCallbackData data) {

  public record OmsCallbackData(
      String orderNo,
      String externalOrderNo,
      Integer status,
      String returnNo,
      Integer afterSaleStatus,
      String carrier,
      String trackingNo,
      String logisticsStatus,
      String trace,
      String omsReturnNo) {}
}
