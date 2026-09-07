package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.ApplyAfterSaleRequest;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.AfterSaleView;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.InvoiceReceiptRequest;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.InvoiceReceiptView;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.LogisticsView;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.OrderFulfillmentView;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.StockAlertRequest;
import com.ikea.server.dto.fulfillment.FulfillmentDtos.StockAlertView;
import com.ikea.server.entity.AfterSaleRequest;
import com.ikea.server.entity.InvoiceReceipt;
import com.ikea.server.entity.LogisticsRecord;
import com.ikea.server.entity.Order;
import com.ikea.server.entity.StockAlert;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsOrderSyncService;
import com.ikea.server.mapper.AfterSaleRequestMapper;
import com.ikea.server.mapper.InvoiceReceiptMapper;
import com.ikea.server.mapper.LogisticsRecordMapper;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.mapper.StockAlertMapper;
import com.ikea.server.model.Product;
import com.ikea.server.web.ResourceNotFoundException;
import com.ikea.server.web.UnauthorizedException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FulfillmentService {

  private static final Logger log = LoggerFactory.getLogger(FulfillmentService.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();

  private final OrderMapper orderMapper;
  private final LogisticsRecordMapper logisticsMapper;
  private final InvoiceReceiptMapper invoiceMapper;
  private final StockAlertMapper stockAlertMapper;
  private final AfterSaleRequestMapper afterSaleMapper;
  private final DataStore dataStore;
  private final OmsChannel omsChannel;
  private final OmsOrderSyncService omsOrderSyncService;

  public FulfillmentService(
      OrderMapper orderMapper,
      LogisticsRecordMapper logisticsMapper,
      InvoiceReceiptMapper invoiceMapper,
      StockAlertMapper stockAlertMapper,
      AfterSaleRequestMapper afterSaleMapper,
      DataStore dataStore,
      OmsChannel omsChannel,
      OmsOrderSyncService omsOrderSyncService) {
    this.orderMapper = orderMapper;
    this.logisticsMapper = logisticsMapper;
    this.invoiceMapper = invoiceMapper;
    this.stockAlertMapper = stockAlertMapper;
    this.afterSaleMapper = afterSaleMapper;
    this.dataStore = dataStore;
    this.omsChannel = omsChannel;
    this.omsOrderSyncService = omsOrderSyncService;
  }

  @Transactional(readOnly = true)
  public OrderFulfillmentView fulfillment(Long userId, String orderNo) {
    requireOrderOwned(userId, orderNo);
    return new OrderFulfillmentView(
        logistics(orderNo),
        latestInvoice(orderNo),
        null,
        latestAfterSale(orderNo));
  }

  public LogisticsView logistics(String orderNo) {
    LogisticsRecord record = logisticsMapper.selectOne(
        Wrappers.lambdaQuery(LogisticsRecord.class)
            .eq(LogisticsRecord::getOrderNo, orderNo)
            .orderByDesc(LogisticsRecord::getId)
            .last("LIMIT 1"));
    if (record == null) {
      return null;
    }
    return new LogisticsView(
        record.getCarrier(),
        record.getTrackingNo(),
        record.getStatus(),
        parseTraces(record.getTraceInfo()),
        record.getUpdatedAt());
  }

  public void upsertLogistics(
      String orderNo, String carrier, String trackingNo, String status, String trace) {
    LogisticsRecord record = logisticsMapper.selectOne(
        Wrappers.lambdaQuery(LogisticsRecord.class)
            .eq(LogisticsRecord::getOrderNo, orderNo)
            .orderByDesc(LogisticsRecord::getId)
            .last("LIMIT 1"));
    if (record == null) {
      record = new LogisticsRecord();
      record.setOrderNo(orderNo);
      logisticsMapper.insert(record);
    }
    record.setCarrier(hasText(carrier) ? carrier : record.getCarrier());
    record.setTrackingNo(hasText(trackingNo) ? trackingNo : record.getTrackingNo());
    record.setStatus(hasText(status) ? status : record.getStatus());
    if (hasText(trace)) {
      List<String> traces = new ArrayList<>(parseTraces(record.getTraceInfo()));
      traces.add(trace);
      record.setTraceInfo(writeTraces(traces));
    }
    logisticsMapper.updateById(record);
  }

  @Transactional
  public InvoiceReceiptView requestInvoice(Long userId, String orderNo, InvoiceReceiptRequest request) {
    Order order = requireOrderOwned(userId, orderNo);
    int kind = request.kind() == null ? 1 : request.kind();
    if (kind != 1 && kind != 2) {
      throw new IllegalArgumentException("单据类型仅支持 1=收据 2=发票");
    }
    InvoiceReceipt invoice = new InvoiceReceipt();
    invoice.setOrderNo(order.getOrderNo());
    invoice.setUserId(userId);
    invoice.setKind(kind);
    invoice.setCompanyName(request.companyName());
    invoice.setTaxNumber(request.taxNumber());
    invoice.setEmail(request.email());
    invoice.setStatus(1);
    invoiceMapper.insert(invoice);
    invoice.setFileUrl("/api/v1/invoices/" + invoice.getId() + "/download");
    invoiceMapper.updateById(invoice);
    return toInvoiceView(invoice);
  }

  public InvoiceReceiptView latestInvoice(String orderNo) {
    InvoiceReceipt invoice = invoiceMapper.selectOne(
        Wrappers.lambdaQuery(InvoiceReceipt.class)
            .eq(InvoiceReceipt::getOrderNo, orderNo)
            .orderByDesc(InvoiceReceipt::getId)
            .last("LIMIT 1"));
    return invoice == null ? null : toInvoiceView(invoice);
  }

  public InvoiceReceipt requireInvoice(Long invoiceId, Long userId) {
    InvoiceReceipt invoice = invoiceMapper.selectById(invoiceId);
    if (invoice == null || invoice.getDeleted() != null && invoice.getDeleted() != 0) {
      throw new ResourceNotFoundException("Invoice not found: " + invoiceId);
    }
    if (userId != null && invoice.getUserId() != null && !userId.equals(invoice.getUserId())) {
      throw new UnauthorizedException("无权下载该单据");
    }
    return invoice;
  }

  public String renderInvoiceText(InvoiceReceipt invoice, Order order) {
    String kindName = invoice.getKind() != null && invoice.getKind() == 2 ? "INVOICE" : "RECEIPT";
    return "BUZUD " + kindName + "\n"
        + "Order No: " + order.getOrderNo() + "\n"
        + "Amount: " + order.getCurrency() + " " + order.getTotalAmount() + "\n"
        + "Customer: " + order.getCustomer() + "\n"
        + "Phone: " + order.getPhone() + "\n"
        + "Address: " + order.getAddress() + "\n"
        + "Issued At: " + invoice.getUpdatedAt() + "\n";
  }

  @Transactional
  public StockAlertView registerStockAlert(Long userId, StockAlertRequest request) {
    if (request.productId() == null || request.productId().isBlank()) {
      throw new IllegalArgumentException("productId 不能为空");
    }
    Product product = dataStore.findProductById(request.productId());
    if (product == null) {
      throw new ResourceNotFoundException("Product not found: " + request.productId());
    }
    String contact = hasText(request.contact()) ? request.contact() : requireUserContact(userId);
    StockAlert alert = new StockAlert();
    alert.setUserId(userId);
    alert.setProductId(request.productId());
    alert.setContact(contact);
    alert.setStatus(0);
    stockAlertMapper.insert(alert);
    return toStockAlertView(alert);
  }

  public StockAlertView latestStockAlert(Long userId, String productId) {
    StockAlert alert = stockAlertMapper.selectOne(
        Wrappers.lambdaQuery(StockAlert.class)
            .eq(StockAlert::getUserId, userId)
            .eq(StockAlert::getProductId, productId)
            .eq(StockAlert::getStatus, 0)
            .orderByDesc(StockAlert::getId)
            .last("LIMIT 1"));
    return alert == null ? null : toStockAlertView(alert);
  }

  @Transactional
  public AfterSaleView applyAfterSale(Long userId, ApplyAfterSaleRequest request) {
    if (request.orderNo() == null || request.orderNo().isBlank()) {
      throw new IllegalArgumentException("orderNo 不能为空");
    }
    Order order = requireOrderOwned(userId, request.orderNo());
    int type = request.type() == null ? 1 : request.type();
    if (!List.of(1, 2, 3, 4).contains(type)) {
      throw new IllegalArgumentException("售后类型仅支持 1=退款 2=退货 3=换货 4=维修");
    }
    if (!List.of(
            OrderStatus.PENDING_SHIPMENT.code(),
            OrderStatus.PENDING_RECEIPT.code(),
            OrderStatus.COMPLETED.code())
        .contains(order.getStatus())) {
      throw new IllegalArgumentException("当前订单状态不允许申请售后");
    }
    Long exists = afterSaleMapper.selectCount(
        Wrappers.lambdaQuery(AfterSaleRequest.class)
            .eq(AfterSaleRequest::getOrderNo, request.orderNo())
            .in(AfterSaleRequest::getStatus, List.of(0, 1)));
    if (exists != null && exists > 0) {
      throw new IllegalArgumentException("该订单已有进行中的售后申请");
    }

    AfterSaleRequest entity = new AfterSaleRequest();
    entity.setOrderNo(request.orderNo());
    entity.setUserId(userId);
    entity.setType(type);
    entity.setReason(request.reason());
    entity.setStatus(1);
    afterSaleMapper.insert(entity);

    if (omsChannel.isEnabled()) {
      omsOrderSyncService.requestAfterSale(order, type, request.reason());
    } else {
      // 未对接 OMS 时仍记录为“已提交，待客服处理”，并同步商城订单为退款中。
      if (type == 1) {
        order.setStatus(OrderStatus.REFUNDING.code());
        orderMapper.updateById(order);
      }
    }
    return toAfterSaleView(entity);
  }

  public AfterSaleView latestAfterSale(String orderNo) {
    AfterSaleRequest entity = afterSaleMapper.selectOne(
        Wrappers.lambdaQuery(AfterSaleRequest.class)
            .eq(AfterSaleRequest::getOrderNo, orderNo)
            .orderByDesc(AfterSaleRequest::getId)
            .last("LIMIT 1"));
    return entity == null ? null : toAfterSaleView(entity);
  }

  public void syncAfterSaleStatus(String orderNo, String omsReturnNo, Integer status) {
    AfterSaleRequest entity = afterSaleMapper.selectOne(
        Wrappers.lambdaQuery(AfterSaleRequest.class)
            .eq(AfterSaleRequest::getOrderNo, orderNo)
            .orderByDesc(AfterSaleRequest::getId)
            .last("LIMIT 1"));
    if (entity == null) {
      return;
    }
    if (hasText(omsReturnNo)) {
      entity.setOmsReturnNo(omsReturnNo);
    }
    if (status != null) {
      entity.setStatus(status);
    }
    afterSaleMapper.updateById(entity);
  }

  private Order requireOrderOwned(Long userId, String orderNo) {
    Order order = orderMapper.selectOne(
        Wrappers.lambdaQuery(Order.class).eq(Order::getOrderNo, orderNo));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    if (order.getUserId() == null || !order.getUserId().equals(userId)) {
      throw new UnauthorizedException("无权操作该订单");
    }
    return order;
  }

  private String requireUserContact(Long userId) {
    // 登录用户通常已有手机号；未取到时允许空串，前端会要求填写。
    return "";
  }

  private List<String> parseTraces(String json) {
    if (!hasText(json)) {
      return new ArrayList<>();
    }
    try {
      return MAPPER.readValue(json, new TypeReference<List<String>>() {});
    } catch (Exception ex) {
      log.warn("解析物流轨迹失败: {}", json);
      return new ArrayList<>();
    }
  }

  private String writeTraces(List<String> traces) {
    try {
      return MAPPER.writeValueAsString(traces);
    } catch (Exception ex) {
      throw new IllegalStateException("序列化物流轨迹失败", ex);
    }
  }

  private InvoiceReceiptView toInvoiceView(InvoiceReceipt invoice) {
    return new InvoiceReceiptView(
        invoice.getId(),
        invoice.getOrderNo(),
        invoice.getKind(),
        invoice.getCompanyName(),
        invoice.getTaxNumber(),
        invoice.getEmail(),
        invoice.getStatus(),
        invoice.getFileUrl(),
        invoice.getErrorMessage(),
        invoice.getCreatedAt());
  }

  private StockAlertView toStockAlertView(StockAlert alert) {
    return new StockAlertView(
        alert.getId(),
        alert.getProductId(),
        alert.getContact(),
        alert.getStatus(),
        alert.getNotifiedAt(),
        alert.getCreatedAt());
  }

  private AfterSaleView toAfterSaleView(AfterSaleRequest entity) {
    return new AfterSaleView(
        entity.getId(),
        entity.getOrderNo(),
        entity.getType(),
        entity.getReason(),
        entity.getStatus(),
        entity.getOmsReturnNo(),
        entity.getCreatedAt());
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
