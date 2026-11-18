package com.ikea.server.dto.order;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class OrderResponseJsonTest {

  private final ObjectMapper mapper =
      new ObjectMapper().setSerializationInclusion(JsonInclude.Include.NON_NULL);

  @Test
  void legacyOrderShouldStillExposeSalesChannelAsNull() throws Exception {
    String json = mapper.writeValueAsString(response(null));

    assertTrue(json.contains("\"salesChannel\":null"), json);
    assertFalse(json.contains("\"customer\""), json);
  }

  @Test
  void channelAwareOrderShouldSerializeItsChannel() throws Exception {
    String json = mapper.writeValueAsString(response("home"));

    assertTrue(json.contains("\"salesChannel\":\"home\""), json);
  }

  private static OrderResponse response(String salesChannel) {
    return new OrderResponse(
        1L,
        "ORD-1",
        1,
        "待付款",
        "SGD",
        salesChannel,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        List.of(),
        null,
        null);
  }
}
