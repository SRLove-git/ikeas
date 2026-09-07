package com.ikea.server.web;

import com.ikea.server.dto.support.SupportDtos.TicketReplyRequest;
import com.ikea.server.dto.support.SupportDtos.TicketView;
import com.ikea.server.service.SupportTicketService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/support-tickets")
public class AdminSupportTicketController {

  private final SupportTicketService ticketService;

  public AdminSupportTicketController(SupportTicketService ticketService) {
    this.ticketService = ticketService;
  }

  @GetMapping
  public List<TicketView> list() {
    return ticketService.listAll();
  }

  @PatchMapping("/{id}/reply")
  public TicketView reply(@PathVariable Long id, @RequestBody TicketReplyRequest body) {
    return ticketService.reply(id, body);
  }
}
