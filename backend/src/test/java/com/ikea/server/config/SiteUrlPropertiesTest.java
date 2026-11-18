package com.ikea.server.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class SiteUrlPropertiesTest {

  @Test
  void defaultsShouldTargetTheThreeStorefrontDomains() {
    SiteUrlProperties properties = new SiteUrlProperties();

    assertEquals("https://medical-sg.com", properties.getMedicalUrl());
    assertEquals("https://home-sg.com", properties.getHomeUrl());
    assertEquals("https://life-sg.com", properties.getPortalUrl());
  }

  @Test
  void baseUrlShouldOnlyResolveForMedicalAndHomeChannels() {
    SiteUrlProperties properties = new SiteUrlProperties();
    properties.setMedicalUrl("https://staging-medical.example");
    properties.setHomeUrl(" https://staging-home.example ");

    assertEquals("https://staging-medical.example", properties.baseUrlFor("medical"));
    assertEquals("https://staging-home.example", properties.baseUrlFor("home"));
    assertNull(properties.baseUrlFor(null));
    assertNull(properties.baseUrlFor("portal"));
    assertNull(properties.baseUrlFor("HOME"));
  }

  @Test
  void blankConfiguredUrlShouldFallBackToNoSiteBase() {
    SiteUrlProperties properties = new SiteUrlProperties();
    properties.setHomeUrl("   ");

    assertNull(properties.baseUrlFor("home"));
  }
}
