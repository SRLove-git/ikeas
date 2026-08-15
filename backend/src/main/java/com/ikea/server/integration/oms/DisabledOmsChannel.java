package com.ikea.server.integration.oms;

import java.math.BigDecimal;

/**
 * 未对接实现（对接开关关闭时装配，对接规范 §4.1 / §8.2）：
 * 业务层无需 if-else 分支，调用前通过 {@link #isEnabled()} 判断。
 */
public class DisabledOmsChannel implements OmsChannel {

  @Override
  public boolean isEnabled() {
    return false;
  }

  @Override
  public OmsOrderOutcome createOrder(OmsOrderInput input) {
    throw new IllegalStateException("OMS 对接未启用");
  }

  @Override
  public OmsOrderOutcome queryOrder(String externalOrderNo) {
    throw new IllegalStateException("OMS 对接未启用");
  }

  @Override
  public void notifyPayment(
      String externalOrderNo, String paymentNo, BigDecimal amount, String channel) {
    throw new IllegalStateException("OMS 对接未启用");
  }

  @Override
  public void cancelOrder(String externalOrderNo) {
    throw new IllegalStateException("OMS 对接未启用");
  }
}
