package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.AfterSaleView;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.ApplyAfterSaleRequest;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.InvoiceReceiptRequest;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.InvoiceReceiptView;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.OrderFulfillmentView;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.StockAlertRequest;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.StockAlertView;
import com.ikea.server.entity.InvoiceReceipt;
import com.ikea.server.entity.Order;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.service.FulfillmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class FulfillmentController {

  private final FulfillmentService fulfillmentService;
  private final OrderMapper orderMapper;

  public FulfillmentController(FulfillmentService fulfillmentService, OrderMapper orderMapper) {
    this.fulfillmentService = fulfillmentService;
    this.orderMapper = orderMapper;
  }

  @GetMapping("/orders/{orderNo}/fulfillment")
  public OrderFulfillmentView fulfillment(
      @PathVariable String orderNo, HttpServletRequest request) {
    return fulfillmentService.fulfillment(userId(request), orderNo);
  }

  @PostMapping("/invoices")
  public InvoiceReceiptView requestInvoice(
      @RequestBody InvoiceReceiptRequest body, HttpServletRequest request) {
    return fulfillmentService.requestInvoice(userId(request), body.orderNo(), body);
  }

  @GetMapping("/invoices/{invoiceId}/download")
  public void downloadInvoice(
      @PathVariable Long invoiceId,
      HttpServletRequest request,
      HttpServletResponse response)
      throws IOException {
    InvoiceReceipt invoice = fulfillmentService.requireInvoice(invoiceId, userId(request));
    Order order = orderMapper.selectOne(
        com.baomidou.mybatisplus.core.toolkit.Wrappers.lambdaQuery(Order.class)
            .eq(Order::getOrderNo, invoice.getOrderNo()));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + invoice.getOrderNo());
    }
    String text = fulfillmentService.renderInvoiceText(invoice, order);
    byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
    response.setStatus(200);
    response.setContentType("text/plain;charset=UTF-8");
    response.setContentLength(bytes.length);
    response.setHeader(
        HttpHeaders.CONTENT_DISPOSITION,
        ContentDisposition.attachment()
            .filename("BUZUD-" + invoice.getOrderNo() + ".txt", StandardCharsets.UTF_8)
            .build()
            .toString());
    response.getOutputStream().write(bytes);
  }

  @PostMapping("/stock-alerts")
  public StockAlertView stockAlert(
      @RequestBody StockAlertRequest body, HttpServletRequest request) {
    return fulfillmentService.registerStockAlert(userId(request), body);
  }

  @PostMapping("/after-sales")
  public AfterSaleView applyAfterSale(
      @RequestBody ApplyAfterSaleRequest body, HttpServletRequest request) {
    return fulfillmentService.applyAfterSale(userId(request), body);
  }

  @GetMapping("/after-sales/by-order/{orderNo}")
  public AfterSaleView latestAfterSale(
      @PathVariable String orderNo, HttpServletRequest request) {
    return fulfillmentService.latestAfterSale(orderNo);
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value == null) {
      throw new UnauthorizedException("请先登录");
    }
    try {
      return Long.valueOf(value);
    } catch (NumberFormatException ex) {
      throw new UnauthorizedException("请先登录");
    }
  }
}
