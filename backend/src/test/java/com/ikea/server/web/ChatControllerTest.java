package com.ikea.server.web;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.data.ChatHistoryStore;
import com.ikea.server.data.ChatKnowledgeStore;
import com.ikea.server.dto.order.OrderResponse;
import com.ikea.server.service.ChatRequestGuard;
import com.ikea.server.service.NovaSupportClient;
import com.ikea.server.service.OrderService;
import com.ikea.server.service.SupportProductCatalog;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ChatControllerTest {
  private final ChatHistoryStore history = mock(ChatHistoryStore.class);
  private final ChatKnowledgeStore knowledge = mock(ChatKnowledgeStore.class);
  private final NovaSupportClient ai = mock(NovaSupportClient.class);
  private final OrderService orders = mock(OrderService.class);
  private final SupportProductCatalog productCatalog = mock(SupportProductCatalog.class);
  private final ChatRequestGuard requestGuard = mock(ChatRequestGuard.class);
  private final ChatController controller =
      new ChatController(history, knowledge, ai, orders, productCatalog, requestGuard);

  ChatControllerTest() {
    when(knowledge.load()).thenReturn(new ChatKnowledgeStore.Knowledge(List.of(), "default"));
    when(productCatalog.evidenceFor(any(), any(), anyInt())).thenReturn(List.of());
  }

  @Test void anonymousCannotReadOrder() {
    assertThrows(UnauthorizedException.class, () -> controller.reply(
        new ChatController.ChatMessage("查订单", "B123"), new MockHttpServletRequest()));
    verifyNoInteractions(orders, ai);
  }

  @Test void customerOrderIsAnsweredLocallyAndNeverSentToAi() {
    var request = new MockHttpServletRequest();
    request.setAttribute(SecurityConstants.USER_ID_ATTRIBUTE, "42");
    when(orders.get(42L, "B123")).thenReturn(new OrderResponse(1L, "B123", 1, "待付款", "SGD",
        "medical", BigDecimal.TEN, BigDecimal.ZERO, BigDecimal.TEN, "PRIVATE_NAME", "PRIVATE_PHONE",
        "PRIVATE_ADDRESS", "PRIVATE_REMARK", List.of(), null, null));
    var result = controller.reply(new ChatController.ChatMessage("查订单", "B123"), request);

    assertTrue(result.reply().contains("订单 B123 当前状态：待付款"));
    assertFalse(result.reply().contains("10"));
    assertFalse(result.reply().contains("SGD"));
    assertTrue(result.citations().isEmpty());
    verifyNoInteractions(ai);
    verify(history).record("42", "查订单", result.reply());
  }

  @Test void upstreamFailureIsExplicitAndRecorded() {
    when(ai.answer(anyString(), isNull(), anyList(), isNull())).thenThrow(new IllegalStateException());
    var result = controller.reply(new ChatController.ChatMessage("你好", null), new MockHttpServletRequest());
    assertTrue(result.degraded());
    assertTrue(result.requiresHuman());
    assertTrue(result.reply().contains("暂时无法连接"));
  }

  @Test void missingUpstreamCitationsBecomeAnEmptyList() {
    when(ai.answer(anyString(), isNull(), anyList(), isNull()))
        .thenReturn(new NovaSupportClient.Reply("可以帮您", "faq", null, false, false));
    when(productCatalog.linksFromAnswer("可以帮您", List.of())).thenReturn(List.of());

    var result = controller.reply(
        new ChatController.ChatMessage("你好", null), new MockHttpServletRequest());

    assertTrue(result.citations().isEmpty());
    assertEquals("可以帮您", result.reply());
  }

  @Test void trustedReverseProxyUsesItsRealClientAddressHeader() {
    var request = new MockHttpServletRequest();
    request.setRemoteAddr("172.18.0.1");
    request.addHeader("X-Real-IP", "203.0.113.19");
    when(ai.answer(anyString(), isNull(), anyList(), isNull()))
        .thenReturn(new NovaSupportClient.Reply("您好", "faq", List.of(), false, false));

    controller.reply(new ChatController.ChatMessage("你好", null), request);

    verify(requestGuard).acquire(null, "203.0.113.19");
  }

  @Test void directPublicClientCannotSpoofRateLimitAddress() {
    var request = new MockHttpServletRequest();
    request.setRemoteAddr("198.51.100.8");
    request.addHeader("X-Real-IP", "203.0.113.20");
    when(ai.answer(anyString(), isNull(), anyList(), isNull()))
        .thenReturn(new NovaSupportClient.Reply("您好", "faq", List.of(), false, false));

    controller.reply(new ChatController.ChatMessage("你好", null), request);

    verify(requestGuard).acquire(null, "198.51.100.8");
  }

  @Test void productQuestionForwardsCatalogueEvidenceAndPageContext() {
    String slug = "hcg-pregnancy-rapid-test-8885020710595";
    when(productCatalog.evidenceFor(eq("这个多少钱"), eq(slug), eq(6)))
        .thenReturn(List.of(new NovaSupportClient.Evidence(
            "商品：HCG Pregnancy Rapid Test\n售价：SGD 9.90\n库存：可售 3 件\n"
                + "商品页：/zh/p/" + slug + "/",
            "商品资料", "catalog://buzud/8885020710595", List.of("hcg", "pregnancy"))));
    var link = new SupportProductCatalog.ProductLink(
        "8885020710595", "HCG Pregnancy Rapid Test", slug, new BigDecimal("9.90"),
        "https://example.test/hcg.png", "/zh/p/" + slug + "/");
    when(productCatalog.linksFromAnswer(anyString(), anyList())).thenReturn(List.of(link));
    when(ai.answer(eq("这个多少钱"), isNull(), anyList(), isNull())).thenAnswer(invocation -> {
      List<NovaSupportClient.Evidence> items = invocation.getArgument(2);
      assertEquals("catalog://buzud/8885020710595", items.getLast().reference());
      assertEquals("商品资料", items.getLast().title());
      return new NovaSupportClient.Reply("SGD 9.90，当前可售 3 件。", "product", List.of(), false, false);
    });
    var result = controller.reply(new ChatController.ChatMessage(
        "这个多少钱", null, null, slug), new MockHttpServletRequest());
    assertEquals("SGD 9.90，当前可售 3 件。", result.reply());
    assertEquals(1, result.products().size());
    assertEquals("8885020710595", result.products().getFirst().id());
    assertEquals("/zh/p/" + slug + "/", result.products().getFirst().url());
    verify(history).record(null, "这个多少钱", "SGD 9.90，当前可售 3 件。");
  }

  @Test void ownershipFailureNeverReachesAi() {
    var request = new MockHttpServletRequest();
    request.setAttribute(SecurityConstants.USER_ID_ATTRIBUTE, "42");
    when(orders.get(42L, "FOREIGN")).thenThrow(new ResourceNotFoundException("Not found"));
    assertThrows(ResourceNotFoundException.class, () -> controller.reply(
        new ChatController.ChatMessage("查订单", "FOREIGN"), request));
    verifyNoInteractions(ai);
  }

  @Test void forwardsCurrentKnowledgeAndConversationForEnglishAndFollowups() {
    when(knowledge.load()).thenReturn(new ChatKnowledgeStore.Knowledge(List.of(
        new ChatKnowledgeStore.Rule("contact", List.of("联系", "邮箱"), "Email current@example.test")), "default"));
    String conversation = "15c63a6b-4623-4692-9019-d2a5ba6298a2";
    when(ai.answer(anyString(), isNull(), anyList(), eq(conversation))).thenAnswer(invocation -> {
      List<NovaSupportClient.Evidence> items = invocation.getArgument(2);
      assertEquals("faq://buzud/contact", items.getFirst().reference());
      assertEquals(List.of("联系", "邮箱"), items.getFirst().keywords());
      return new NovaSupportClient.Reply("current@example.test", "faq", List.of(), false, false);
    });
    for (String question : List.of("How can I contact you?", "请把刚才那条再发一遍。")) {
      assertEquals("current@example.test", controller.reply(
          new ChatController.ChatMessage(question, null, conversation), new MockHttpServletRequest()).reply());
    }
  }
}
