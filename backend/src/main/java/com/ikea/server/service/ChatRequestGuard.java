package com.ikea.server.service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Bounds public support-chat traffic before a request can occupy an AI client thread. */
@Service
public class ChatRequestGuard {

  private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();

  private final int anonymousPerMinute;
  private final int authenticatedPerMinute;
  private final int globalPerMinute;
  private final Semaphore concurrentRequests;
  private final WindowCounter globalCounter = new WindowCounter();
  private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
  private final AtomicLong cleanupSequence = new AtomicLong();

  public ChatRequestGuard(
      @Value("${ikea.chat.rate-limit.anonymous-per-minute:10}") int anonymousPerMinute,
      @Value("${ikea.chat.rate-limit.authenticated-per-minute:30}") int authenticatedPerMinute,
      @Value("${ikea.chat.rate-limit.global-per-minute:120}") int globalPerMinute,
      @Value("${ikea.chat.max-concurrent:8}") int maxConcurrent) {
    this.anonymousPerMinute = Math.max(1, anonymousPerMinute);
    this.authenticatedPerMinute = Math.max(1, authenticatedPerMinute);
    this.globalPerMinute = Math.max(1, globalPerMinute);
    this.concurrentRequests = new Semaphore(Math.max(1, maxConcurrent), true);
  }

  public Lease acquire(String userId, String remoteAddress) {
    long now = System.currentTimeMillis();
    boolean authenticated = userId != null && !userId.isBlank();
    String key = authenticated
        ? "user:" + userId.trim()
        : "ip:" + normaliseAddress(remoteAddress);
    int perKeyLimit = authenticated ? authenticatedPerMinute : anonymousPerMinute;

    if (!globalCounter.tryAcquire(globalPerMinute, now)) {
      throw new RateLimitExceededException("智能客服请求较多，请稍后再试");
    }
    WindowCounter counter = counters.computeIfAbsent(key, ignored -> new WindowCounter());
    if (!counter.tryAcquire(perKeyLimit, now)) {
      throw new RateLimitExceededException("请求过于频繁，请稍后再试");
    }
    cleanupExpiredCounters(now);

    if (!concurrentRequests.tryAcquire()) {
      throw new CapacityExceededException("智能客服当前繁忙，请稍后再试");
    }
    return new Lease(concurrentRequests);
  }

  private void cleanupExpiredCounters(long now) {
    if ((cleanupSequence.incrementAndGet() & 255L) != 0) {
      return;
    }
    counters.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
  }

  private static String normaliseAddress(String remoteAddress) {
    return remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress.trim();
  }

  private static final class WindowCounter {
    private long startedAt;
    private int count;

    synchronized boolean tryAcquire(int limit, long now) {
      if (startedAt == 0 || now - startedAt >= WINDOW_MILLIS) {
        startedAt = now;
        count = 0;
      }
      if (count >= limit) {
        return false;
      }
      count++;
      return true;
    }

    synchronized boolean isExpired(long now) {
      return startedAt != 0 && now - startedAt >= WINDOW_MILLIS;
    }
  }

  public static final class Lease implements AutoCloseable {
    private final Semaphore semaphore;
    private final AtomicBoolean closed = new AtomicBoolean();

    private Lease(Semaphore semaphore) {
      this.semaphore = semaphore;
    }

    @Override
    public void close() {
      if (closed.compareAndSet(false, true)) {
        semaphore.release();
      }
    }
  }

  public static class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
      super(message);
    }
  }

  public static class CapacityExceededException extends RuntimeException {
    public CapacityExceededException(String message) {
      super(message);
    }
  }
}
