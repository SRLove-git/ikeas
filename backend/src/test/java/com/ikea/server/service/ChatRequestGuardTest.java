package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class ChatRequestGuardTest {

  @Test
  void anonymousRequestsAreLimitedPerAddress() {
    ChatRequestGuard guard = new ChatRequestGuard(1, 10, 20, 2);
    try (ChatRequestGuard.Lease ignored = guard.acquire(null, "203.0.113.7")) {
      // The first request is accepted.
    }

    assertThrows(
        ChatRequestGuard.RateLimitExceededException.class,
        () -> guard.acquire(null, "203.0.113.7"));
    assertDoesNotThrow(() -> {
      try (ChatRequestGuard.Lease ignored = guard.acquire(null, "203.0.113.8")) {
        // A different client has an independent quota.
      }
    });
  }

  @Test
  void concurrentRequestsAreBoundedAndLeaseReleasesCapacity() {
    ChatRequestGuard guard = new ChatRequestGuard(10, 10, 20, 1);
    ChatRequestGuard.Lease first = guard.acquire("42", "127.0.0.1");
    try {
      assertThrows(
          ChatRequestGuard.CapacityExceededException.class,
          () -> guard.acquire("43", "127.0.0.1"));
    } finally {
      first.close();
    }

    assertDoesNotThrow(() -> {
      try (ChatRequestGuard.Lease ignored = guard.acquire("43", "127.0.0.1")) {
        // Closing the first lease made capacity available again.
      }
    });
  }

  @Test
  void globalQuotaBoundsDistributedTraffic() {
    ChatRequestGuard guard = new ChatRequestGuard(10, 10, 1, 2);
    try (ChatRequestGuard.Lease ignored = guard.acquire(null, "203.0.113.1")) {
      // The first request consumes the global quota.
    }

    assertThrows(
        ChatRequestGuard.RateLimitExceededException.class,
        () -> guard.acquire(null, "203.0.113.2"));
  }
}
