package com.ikea.server.integration.oms;

/** OMS 调用异常：HTTP 错误、网关验签失败、业务错误码（code != 0）等。 */
public class OmsCallException extends RuntimeException {

  private final int code;

  public OmsCallException(String message) {
    this(0, message, null);
  }

  public OmsCallException(int code, String message) {
    this(code, message, null);
  }

  public OmsCallException(int code, String message, Throwable cause) {
    super(message, cause);
    this.code = code;
  }

  /** OMS 响应错误码；网络层错误为 0。 */
  public int code() {
    return code;
  }
}
