package com.ikea.server.service;

/** Authentication or authorization failure that should be mapped to 401. */
public class AuthException extends RuntimeException {

  public AuthException(String message) {
    super(message);
  }
}
