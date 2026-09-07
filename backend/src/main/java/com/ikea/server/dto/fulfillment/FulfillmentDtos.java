package com.ikea.server.dto.fulfillment;

import java.time.LocalDateTime;
import java.util.List;

public final class FulfillmentDtos {

  private FulfillmentDtos() {}

  public record LogisticsView(
      String carrier,
      String trackingNo,
      String status,
      List<String> traces,
      LocalDateTime updatedAt) {}

  public record InvoiceReceiptRequest(
      String orderNo,
      Integer kind,
      String companyName,
      String taxNumber,
      String email) {}

  public record InvoiceReceiptView(
      Long id,
      String orderNo,
      Integer kind,
      String companyName,
      String taxNumber,
      String email,
      Integer status,
      String fileUrl,
      String errorMessage,
      LocalDateTime createdAt) {}

  public record StockAlertRequest(String productId, String contact) {}

  public record StockAlertView(
      Long id,
      String productId,
      String contact,
      Integer status,
      LocalDateTime notifiedAt,
      LocalDateTime createdAt) {}

  public record ApplyAfterSaleRequest(String orderNo, Integer type, String reason) {}

  public record AfterSaleView(
      Long id,
      String orderNo,
      Integer type,
      String reason,
      Integer status,
      String omsReturnNo,
      LocalDateTime createdAt) {}

  public record OrderFulfillmentView(
      LogisticsView logistics,
      InvoiceReceiptView latestInvoice,
      StockAlertView stockAlert,
      AfterSaleView afterSale) {}
}
