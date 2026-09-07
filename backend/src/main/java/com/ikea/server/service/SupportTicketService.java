package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.support.SupportDtos.TicketReplyRequest;
import com.ikea.server.dto.support.SupportDtos.TicketRequest;
import com.ikea.server.dto.support.SupportDtos.TicketView;
import com.ikea.server.entity.SupportTicket;
import com.ikea.server.mapper.SupportTicketMapper;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {

  private static final DateTimeFormatter NO_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

  private final SupportTicketMapper ticketMapper;

  public SupportTicketService(SupportTicketMapper ticketMapper) {
    this.ticketMapper = ticketMapper;
  }

  @Transactional
  public TicketView create(Long userId, TicketRequest request) {
    if (request.subject() == null || request.subject().isBlank()
        || request.message() == null || request.message().isBlank()) {
      throw new IllegalArgumentException("主题和问题描述不能为空");
    }
    SupportTicket ticket = new SupportTicket();
    ticket.setTicketNo(generateNo());
    ticket.setUserId(userId);
    ticket.setOrderNo(request.orderNo());
    ticket.setAfterSaleNo(request.afterSaleNo());
    ticket.setSubject(request.subject().trim());
    ticket.setMessage(request.message().trim());
    ticket.setStatus(0);
    ticketMapper.insert(ticket);
    return toView(ticket);
  }

  public List<TicketView> list(Long userId) {
    return ticketMapper.selectList(
            Wrappers.lambdaQuery(SupportTicket.class)
                .eq(SupportTicket::getUserId, userId)
                .orderByDesc(SupportTicket::getId))
        .stream().map(this::toView).toList();
  }

  public List<TicketView> listAll() {
    return ticketMapper.selectList(
            Wrappers.lambdaQuery(SupportTicket.class).orderByDesc(SupportTicket::getId))
        .stream().map(this::toView).toList();
  }

  @Transactional
  public TicketView reply(Long ticketId, TicketReplyRequest request) {
    SupportTicket ticket = ticketMapper.selectById(ticketId);
    if (ticket == null) {
      throw new IllegalArgumentException("工单不存在");
    }
    ticket.setReply(request.reply());
    ticket.setAssignee(request.assignee());
    ticket.setStatus(request.status() == null ? 1 : request.status());
    ticket.setRepliedAt(LocalDateTime.now());
    ticketMapper.updateById(ticket);
    return toView(ticket);
  }

  private String generateNo() {
    return "T" + LocalDateTime.now().format(NO_TIME) + ThreadLocalRandom.current().nextInt(1000, 10000);
  }

  private TicketView toView(SupportTicket ticket) {
    return new TicketView(
        ticket.getId(),
        ticket.getTicketNo(),
        ticket.getUserId(),
        ticket.getOrderNo(),
        ticket.getAfterSaleNo(),
        ticket.getSubject(),
        ticket.getMessage(),
        ticket.getStatus(),
        ticket.getAssignee(),
        ticket.getReply(),
        ticket.getRepliedAt(),
        ticket.getCreatedAt());
  }
}
