package com.ikea.server.web;

import com.ikea.server.data.ChatHistoryStore;
import com.ikea.server.data.ChatKnowledgeStore;
import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.service.ChatRequestGuard;
import com.ikea.server.service.NovaSupportClient;
import com.ikea.server.service.NovaSupportClient.Evidence;
import com.ikea.server.service.OrderService;
import com.ikea.server.service.SupportProductCatalog;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import java.util.ArrayList;
import java.util.Map;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** AI support using server-owned knowledge, the current catalogue and customer-scoped orders. */
@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

  public record ChatMessage(@NotBlank @Size(max = 2000) String message,
                            @Size(max = 80) String orderNo,
                            @Pattern(regexp = "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}") String conversationId,
                            @Size(max = 200) String productSlug) {
    public ChatMessage(String message, String orderNo) { this(message, orderNo, null, null); }
    public ChatMessage(String message, String orderNo, String conversationId) {
      this(message, orderNo, conversationId, null);
    }
  }

  public record ChatReply(String reply, List<Map<String, String>> citations,
                          List<SupportProductCatalog.ProductLink> products,
                          boolean requiresHuman, boolean degraded) {}

  private final ChatHistoryStore chatHistory;
  private final ChatKnowledgeStore knowledgeStore;
  private final NovaSupportClient ai;
  private final OrderService orders;
  private final SupportProductCatalog productCatalog;
  private final ChatRequestGuard requestGuard;

  public ChatController(ChatHistoryStore chatHistory, ChatKnowledgeStore knowledgeStore,
                        NovaSupportClient ai, OrderService orders,
                        SupportProductCatalog productCatalog, ChatRequestGuard requestGuard) {
    this.chatHistory = chatHistory;
    this.knowledgeStore = knowledgeStore;
    this.ai = ai;
    this.orders = orders;
    this.productCatalog = productCatalog;
    this.requestGuard = requestGuard;
  }

  @PostMapping("/messages")
  public ChatReply reply(@Valid @RequestBody ChatMessage message, HttpServletRequest request) {
    String userId = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    try (ChatRequestGuard.Lease ignored = requestGuard.acquire(userId, clientAddress(request))) {
      String orderNo = message.orderNo();
      if (orderNo != null && !orderNo.isBlank()) {
        if (userId == null) throw new UnauthorizedException("请先登录后查询订单");
        var order = orders.get(Long.valueOf(userId), orderNo.trim());
        // Keep customer-scoped transaction details inside this backend. Order data and the
        // authenticated user identifier must never be forwarded to the external AI service.
        ChatReply result = new ChatReply(
            "订单 " + order.orderNo() + " 当前状态：" + order.statusLabel()
                + "。物流轨迹、退款到账等详情请以订单详情页为准，或联系人工客服。",
            List.of(), List.of(), false, false);
        chatHistory.record(userId, message.message(), result.reply());
        return result;
      }

      ChatKnowledgeStore.Knowledge knowledge = knowledgeStore.load();
      List<Evidence> evidence = new ArrayList<>();
      // Send current FAQ candidates so the AI can resolve multilingual and follow-up queries.
      // Only the AI service selects the relevant entries; previous answers are never evidence.
      knowledge.rules().stream()
              .filter(rule -> rule.reply() != null && !rule.reply().isBlank())
              .limit(10).forEach(rule -> evidence.add(new Evidence(rule.reply(), "BUZUD 客服知识",
                  "faq://buzud/" + rule.id(), rule.keywords() == null ? List.of() :
                      rule.keywords().stream().filter(java.util.Objects::nonNull).limit(32).toList())));
      // Select from the complete product catalogue on every request, so the AI can answer
      // price, specification, usage and availability questions without a stale snapshot.
      evidence.addAll(productCatalog.evidenceFor(message.message(), message.productSlug(), 6));
      ChatReply result;
      try {
        // Conversation continuity comes from the random conversation ID; the external service
        // does not need the storefront's persistent numeric customer identifier.
        var answer = ai.answer(message.message(), null, evidence, message.conversationId());
        List<Map<String, String>> citations = answer.citations() == null
            ? List.of()
            : answer.citations().stream().filter(java.util.Objects::nonNull).toList();
        result = new ChatReply(
            answer.answer(),
            citations,
            productCatalog.linksFromAnswer(answer.answer(), citations),
            answer.requires_human(),
            false);
      } catch (IllegalStateException ex) {
        // An unavailable model must never be presented as an executed business operation.
        result = new ChatReply("智能客服暂时无法连接，请稍后重试或通过客户服务页面联系人工。",
            List.of(), List.of(), true, true);
      }
      chatHistory.record(userId, message.message(), result.reply());
      return result;
    }
  }

  private static String clientAddress(HttpServletRequest request) {
    String remoteAddress = request.getRemoteAddr();
    if (!isTrustedProxy(remoteAddress)) {
      return remoteAddress;
    }
    String realIp = validAddress(request.getHeader("X-Real-IP"));
    if (realIp != null) {
      return realIp;
    }
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null) {
      String[] addresses = forwarded.split(",");
      for (int index = addresses.length - 1; index >= 0; index--) {
        String candidate = validAddress(addresses[index]);
        if (candidate != null) {
          return candidate;
        }
      }
    }
    return remoteAddress;
  }

  private static String validAddress(String value) {
    if (value == null) {
      return null;
    }
    String candidate = value.trim();
    if (candidate.length() > 64 || !candidate.matches("[0-9a-fA-F:.]+")) {
      return null;
    }
    return candidate;
  }

  private static boolean isTrustedProxy(String address) {
    if (address == null) {
      return false;
    }
    String value = address.trim().toLowerCase(java.util.Locale.ROOT);
    if (value.equals("::1") || value.startsWith("127.") || value.startsWith("10.")
        || value.startsWith("192.168.") || value.startsWith("fc") || value.startsWith("fd")
        || value.startsWith("fe80:")) {
      return true;
    }
    if (!value.startsWith("172.")) {
      return false;
    }
    String[] parts = value.split("\\.");
    if (parts.length < 2) {
      return false;
    }
    try {
      int second = Integer.parseInt(parts[1]);
      return second >= 16 && second <= 31;
    } catch (NumberFormatException ignored) {
      return false;
    }
  }
}
