package com.ikea.server.constant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class SalesChannelTest {

  @Test
  void explicitSupportedScopeShouldWinOverProductDerivation() {
    assertEquals(
        SalesChannel.HOME,
        SalesChannel.resolve(SalesChannel.HOME, List.of("8885020710595")));
    assertEquals(
        SalesChannel.MEDICAL,
        SalesChannel.resolve(SalesChannel.MEDICAL, List.of("midea-mx-100")));
  }

  @Test
  void unsupportedOrMissingScopeShouldBeDerivedFromProductIds() {
    assertEquals(
        SalesChannel.HOME, SalesChannel.resolve(null, List.of("midea-mx-100", "toshiba-tv-55")));
    assertEquals(
        SalesChannel.HOME, SalesChannel.resolve("portal", List.of("midea-mx-100")));
    assertEquals(
        SalesChannel.MEDICAL,
        SalesChannel.resolve(null, List.of("midea-mx-100", "8885020710595")));
    assertEquals(
        SalesChannel.MEDICAL, SalesChannel.resolve("HOME", List.of("8885020710595")));
  }

  @Test
  void emptyOrNullProductListShouldDefaultToMedical() {
    assertEquals(SalesChannel.MEDICAL, SalesChannel.resolve(null, List.of()));
    assertEquals(SalesChannel.MEDICAL, SalesChannel.resolve(null, null));
  }

  @Test
  void onlyMideaAndToshibaPrefixesCountAsHomeProducts() {
    assertTrue(SalesChannel.isHomeProductId("midea-mx-100"));
    assertTrue(SalesChannel.isHomeProductId("toshiba-tv-55"));
    assertFalse(SalesChannel.isHomeProductId("8885020710595"));
    assertFalse(SalesChannel.isHomeProductId("Midea-mx-100"));
    assertFalse(SalesChannel.isHomeProductId(null));
    assertFalse(SalesChannel.isHomeProductId(" "));
  }
}
