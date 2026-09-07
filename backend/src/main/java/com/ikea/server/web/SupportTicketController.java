package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.support.SupportDtos.TicketRequest;
import com.ikea.server.dto.support.SupportDtos.TicketView;
import com.ikea.server.service.SupportTicketService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/support-tickets")
public class SupportTicketController {

  private final SupportTicketService ticketService;

  public SupportTicketController(SupportTicketService ticketService) {
    this.ticketService = ticketService;
  }

  @PostMapping
  public TicketView create(@RequestBody TicketRequest body, HttpServletRequest request) {
    return ticketService.create(userId(request), body);
  }

  @GetMapping
  public List<TicketView> list(HttpServletRequest request) {
    return ticketService.list(userId(request));
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value == null) {
      throw new UnauthorizedException("请先登录");
    }
    return Long.valueOf(value);
  }
}
