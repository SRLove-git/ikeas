package com.ikea.server.integration.oms;

import com.ikea.server.constant.OrderStatus;
import java.util.Map;

/**
 * 订单状态映射（对接规范 §6.3）：OMS 状态 → BUZUD 本地状态。
 * 回写规则：只允许推进，不允许回退（调用方负责比较，见 OmsOrderSyncService）。
 */
public final class OmsStatusMapping {

  /** OMS 1 待支付 2 已支付 3 已审核 4 已发货 5 已签收 6 已完成 7 已取消。 */
  private static final Map<Integer, Integer> OMS_TO_LOCAL =
      Map.of(
          1, OrderStatus.PENDING_PAYMENT.code(),
          2, OrderStatus.PENDING_SHIPMENT.code(),
          3, OrderStatus.PENDING_SHIPMENT.code(),
          4, OrderStatus.PENDING_RECEIPT.code(),
          5, OrderStatus.PENDING_RECEIPT.code(),
          6, OrderStatus.COMPLETED.code(),
          7, OrderStatus.CANCELLED.code());

  private OmsStatusMapping() {}

  /** 返回 OMS 状态对应的本地状态；未知状态返回 -1（不推进）。 */
  public static int toLocal(Integer omsStatus) {
    if (omsStatus == null) {
      return -1;
    }
    return OMS_TO_LOCAL.getOrDefault(omsStatus, -1);
  }

  /** 本地状态是否可由轮询推进（未终态、非退款中）。 */
  public static boolean isPollable(Integer localStatus) {
    return localStatus != null
        && (localStatus == OrderStatus.PENDING_PAYMENT.code()
            || localStatus == OrderStatus.PENDING_SHIPMENT.code()
            || localStatus == OrderStatus.PENDING_RECEIPT.code());
  }
}
