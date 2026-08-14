package com.ikea.server.constant;

/** Authentication-related request attributes and shared values. */
public final class SecurityConstants {

  public static final String USER_ID_ATTRIBUTE = "ikea.userId";
  public static final String TOKEN_ATTRIBUTE = "ikea.token";
  public static final String JWT_ERROR_ATTRIBUTE = "ikea.jwtError";

  public static final String ROLE_CUSTOMER = "CUSTOMER";
  public static final String TOKEN_TYPE_REFRESH = "REFRESH";

  private SecurityConstants() {}
}
