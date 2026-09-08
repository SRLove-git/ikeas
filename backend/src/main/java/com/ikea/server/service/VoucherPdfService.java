package com.ikea.server.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.ikea.server.entity.ExperienceVoucher;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** 使用仓库内既有 A4 印刷模板叠加可变券码与动态二维码。 */
@Service
public class VoucherPdfService {

  private static final String POINTS_TEMPLATE =
      "/voucher-templates/BUZUD_Points_Card_2SETS_A4.pdf";
  private static final String EXPERIENCE_TEMPLATE =
      "/voucher-templates/BUZUD_Experience_Voucher_2UP_A4.pdf";

  private static final float POINTS_QR_X = 663.945f;
  private static final float POINTS_QR_Y = 298.64f;
  private static final float POINTS_QR_SIZE = 102f;
  private static final float POINTS_CODE_X = 720.945f;
  private static final float POINTS_CODE_Y = 240.5f;

  private static final float EXPERIENCE_QR_X = 665.945f;
  private static final float EXPERIENCE_QR_Y = 292.64f;
  private static final float EXPERIENCE_QR_SIZE = 110f;
  private static final float EXPERIENCE_CODE_X = 716.945f;
  private static final float EXPERIENCE_CODE_Y = 347.5f;
  private static final float EXPERIENCE_VALID_X = 716.945f;
  private static final float EXPERIENCE_VALID_Y = 320f;

  private static final DateTimeFormatter VALID_UNTIL = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  private final String bookingUrl;
  private final String pointsRedeemUrl;
  private final PDType1Font codeFont;

  public VoucherPdfService(
      @Value("${ikea.voucher.booking-url:https://medical-sg.com/en/booking/}") String bookingUrl,
      @Value("${ikea.voucher.points-redeem-url:https://medical-sg.com/zh/profile/}") String pointsRedeemUrl) {
    this.bookingUrl = bookingUrl == null || bookingUrl.isBlank()
        ? "https://medical-sg.com/en/booking/"
        : bookingUrl;
    this.pointsRedeemUrl = pointsRedeemUrl == null || pointsRedeemUrl.isBlank()
        ? "https://medical-sg.com/zh/profile/"
        : pointsRedeemUrl;
    this.codeFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
  }

  public byte[] generate(List<ExperienceVoucher> vouchers) {
    List<PDDocument> templates = new java.util.ArrayList<>();
    try (PDDocument output = new PDDocument(); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
      for (ExperienceVoucher voucher : vouchers) {
        boolean points = voucher.getType() != null && voucher.getType() == 2;
        String templatePath = points ? POINTS_TEMPLATE : EXPERIENCE_TEMPLATE;
        PDDocument template = loadTemplate(templatePath);
        templates.add(template);
        PDPage front = output.importPage(template.getPage(0));
        PDPage back = output.importPage(template.getPage(1));

        if (points) {
          overlayPointsFront(output, front, voucher.getCode());
        } else {
          overlayExperienceFront(output, front, voucher.getCode());
          overlayExperienceBack(output, back, voucher.getCode(), voucher.getValidUntil());
        }
      }
      output.save(bytes);
      return bytes.toByteArray();
    } catch (IOException ex) {
      throw new IllegalStateException("生成体验券 PDF 失败", ex);
    } finally {
      for (PDDocument template : templates) {
        try {
          template.close();
        } catch (IOException ignored) {
          // 模板在输出完成后关闭失败不影响已生成结果
        }
      }
    }
  }

  public String filename(List<ExperienceVoucher> vouchers) {
    boolean points = vouchers.stream().anyMatch(v -> v.getType() != null && v.getType() == 2);
    return (points ? "buzud-points-cards" : "buzud-experience-vouchers") + ".pdf";
  }

  private PDDocument loadTemplate(String path) throws IOException {
    try (InputStream in = getClass().getResourceAsStream(path)) {
      if (in == null) {
        throw new IOException("模板不存在: " + path);
      }
      return Loader.loadPDF(in.readAllBytes());
    }
  }

  private void overlayPointsFront(PDDocument document, PDPage page, String code) throws IOException {
    try (PDPageContentStream cs =
        new PDPageContentStream(
            document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
      cover(cs, POINTS_QR_X, POINTS_QR_Y, POINTS_QR_SIZE, POINTS_QR_SIZE);
      drawQr(cs, pointsRedeemUrlFor(code), POINTS_QR_X, POINTS_QR_Y, POINTS_QR_SIZE);
      drawCentered(cs, codeFont, 9, code, POINTS_CODE_X, POINTS_CODE_Y);
    }
  }

  private void overlayExperienceFront(PDDocument document, PDPage page, String code)
      throws IOException {
    try (PDPageContentStream cs =
        new PDPageContentStream(
            document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
      cover(cs, EXPERIENCE_QR_X, EXPERIENCE_QR_Y, EXPERIENCE_QR_SIZE, EXPERIENCE_QR_SIZE);
      drawQr(cs, bookingUrlFor(code), EXPERIENCE_QR_X, EXPERIENCE_QR_Y, EXPERIENCE_QR_SIZE);
    }
  }

  private void overlayExperienceBack(
      PDDocument document, PDPage page, String code, java.time.LocalDateTime validUntil)
      throws IOException {
    try (PDPageContentStream cs =
        new PDPageContentStream(
            document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
      drawCentered(cs, codeFont, 9, code, EXPERIENCE_CODE_X, EXPERIENCE_CODE_Y);
      if (validUntil != null) {
        drawCentered(cs, codeFont, 9, VALID_UNTIL.format(validUntil),
            EXPERIENCE_VALID_X, EXPERIENCE_VALID_Y);
      }
    }
  }

  private void cover(PDPageContentStream cs, float x, float y, float width, float height)
      throws IOException {
    cs.setNonStrokingColor(Color.WHITE);
    cs.addRect(x, y, width, height);
    cs.fill();
  }

  private void drawCentered(
      PDPageContentStream cs, PDType1Font font, float size, String text, float centerX, float baselineY)
      throws IOException {
    float width = font.getStringWidth(text) / 1000f * size;
    cs.beginText();
    cs.setFont(font, size);
    cs.setNonStrokingColor(Color.BLACK);
    cs.newLineAtOffset(centerX - width / 2f, baselineY);
    cs.showText(text);
    cs.endText();
  }

  private void drawQr(PDPageContentStream cs, String content, float x, float y, float size) {
    try {
      Map<EncodeHintType, Object> hints = new HashMap<>();
      hints.put(EncodeHintType.MARGIN, 1);
      BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 300, 300, hints);
      int moduleCount = matrix.getWidth();
      float cell = size / moduleCount;
      cs.setNonStrokingColor(Color.BLACK);
      for (int row = 0; row < moduleCount; row++) {
        for (int col = 0; col < moduleCount; col++) {
          if (matrix.get(col, row)) {
            cs.addRect(x + col * cell, y + size - (row + 1) * cell, cell, cell);
          }
        }
      }
      cs.fill();
    } catch (Exception ex) {
      throw new IllegalStateException("生成二维码失败", ex);
    }
  }

  private String bookingUrlFor(String code) {
    return bookingUrl
        + (bookingUrl.contains("?") ? "&" : "?")
        + "voucher="
        + URLEncoder.encode(code, StandardCharsets.UTF_8);
  }

  private String pointsRedeemUrlFor(String code) {
    return pointsRedeemUrl
        + (pointsRedeemUrl.contains("?") ? "&" : "?")
        + "voucher="
        + URLEncoder.encode(code, StandardCharsets.UTF_8);
  }
}
