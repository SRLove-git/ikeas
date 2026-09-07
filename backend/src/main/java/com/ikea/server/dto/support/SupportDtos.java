package com.ikea.server.dto.support;

import java.time.LocalDateTime;
import java.util.List;

public final class SupportDtos {

  private SupportDtos() {}

  public record TicketRequest(String orderNo, String afterSaleNo, String subject, String message) {}

  public record TicketReplyRequest(String reply, String assignee, Integer status) {}

  public record TicketView(
      Long id,
      String ticketNo,
      Long userId,
      String orderNo,
      String afterSaleNo,
      String subject,
      String message,
      Integer status,
      String assignee,
      String reply,
      LocalDateTime repliedAt,
      LocalDateTime createdAt) {}
}
