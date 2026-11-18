package com.ikea.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class NovaSupportClient {
  public record Evidence(String content, String title, String reference, List<String> keywords) {
    public Evidence(String content, String title, String reference) { this(content, title, reference, List.of()); }
  }
  public record Reply(String answer, String intent, List<Map<String, String>> citations,
                      boolean requires_human, boolean requires_confirmation) {}
  private final ObjectMapper mapper;
  private final String baseUrl;
  private final String secret;
  private final HttpClient client = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1)
      .connectTimeout(Duration.ofSeconds(3)).build();

  public NovaSupportClient(ObjectMapper mapper,
      @Value("${NOVA_AI_URL:http://127.0.0.1:8000}") String baseUrl,
      @Value("${NOVA_AI_SECRET:}") String secret) {
    this.mapper = mapper;
    this.baseUrl = baseUrl.replaceAll("/+$", "");
    this.secret = secret;
  }

  public Reply answer(String message, String subject, List<Evidence> evidence) {
    return answer(message, subject, evidence, null);
  }

  public Reply answer(String message, String subject, List<Evidence> evidence, String conversationId) {
    if (secret.isBlank()) throw new IllegalStateException("NOVA AI is not configured");
    try {
      var payload = new java.util.LinkedHashMap<String, Object>();
      payload.put("message", message);
      payload.put("subject", subject);
      payload.put("evidence", evidence);
      payload.put("conversation_id", conversationId);
      String body = mapper.writeValueAsString(payload);
      String timestamp = Long.toString(Instant.now().getEpochSecond());
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      String signature = HexFormat.of().formatHex(mac.doFinal(
          ("buzud\n" + timestamp + "\n" + body).getBytes(StandardCharsets.UTF_8)));
      var request = HttpRequest.newBuilder(URI.create(baseUrl + "/v1/integrations/buzud/chat"))
          .timeout(Duration.ofSeconds(30)).header("Content-Type", "application/json")
          .header("X-Support-Timestamp", timestamp).header("X-Support-Signature", signature)
          .POST(HttpRequest.BodyPublishers.ofString(body)).build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) throw new IllegalStateException("NOVA upstream unavailable");
      Reply reply = mapper.readValue(response.body(), Reply.class);
      if (reply.answer() == null || reply.answer().isBlank()) throw new IllegalStateException("Empty AI reply");
      return reply;
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("NOVA request interrupted", ex);
    } catch (Exception ex) {
      throw new IllegalStateException("NOVA request failed", ex);
    }
  }
}
