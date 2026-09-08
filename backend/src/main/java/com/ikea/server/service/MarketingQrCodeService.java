package com.ikea.server.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** 生成扫码领券落地页二维码。 */
@Service
public class MarketingQrCodeService {

  private final String publicBaseUrl;

  public MarketingQrCodeService(
      @Value("${ikea.marketing.public-base-url:https://medical-sg.com}") String publicBaseUrl) {
    this.publicBaseUrl = publicBaseUrl.endsWith("/")
        ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
        : publicBaseUrl;
  }

  public byte[] couponQr(String couponCode) {
    return png(claimUrl(couponCode), 320);
  }

  private String claimUrl(String couponCode) {
    String encodedCode = URLEncoder.encode(couponCode, StandardCharsets.UTF_8);
    return publicBaseUrl + "/zh/coupon?code=" + encodedCode;
  }

  private byte[] png(String content, int size) {
    try {
      Map<EncodeHintType, Object> hints = Map.of(EncodeHintType.MARGIN, 1);
      BitMatrix matrix =
          new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, size, size, hints);
      BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
      Graphics2D graphics = image.createGraphics();
      try {
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, size, size);
        graphics.setColor(Color.BLACK);
        int moduleCount = matrix.getWidth();
        int cell = size / moduleCount;
        int offset = (size - moduleCount * cell) / 2;
        for (int row = 0; row < moduleCount; row++) {
          for (int col = 0; col < moduleCount; col++) {
            if (matrix.get(col, row)) {
              graphics.fillRect(offset + col * cell, offset + row * cell, cell, cell);
            }
          }
        }
      } finally {
        graphics.dispose();
      }
      ByteArrayOutputStream output = new ByteArrayOutputStream();
      ImageIO.write(image, "png", output);
      return output.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("生成优惠券二维码失败", ex);
    }
  }
}
