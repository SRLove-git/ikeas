package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ikea.server.entity.ExperienceVoucher;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class VoucherPdfServiceTest {

  @Test
  void generatePointsAndExperiencePdf() throws Exception {
    VoucherPdfService service =
        new VoucherPdfService(
            "https://medical-sg.com/en/booking/",
            "https://medical-sg.com/zh/profile/");

    ExperienceVoucher points = voucher("BZP-TEST-001", 2, null);
    ExperienceVoucher experience = voucher("BZE-TEST-001", 1, LocalDateTime.now().plusDays(30));

    byte[] pdf = service.generate(List.of(points, experience));

    assertTrue(pdf.length > 1000);
    assertEquals('%', (char) pdf[0]);
    assertEquals('P', (char) pdf[1]);
    Files.write(Path.of("target/voucher-pdf-test.pdf"), pdf);
  }

  private static ExperienceVoucher voucher(String code, int type, LocalDateTime validUntil) {
    ExperienceVoucher voucher = new ExperienceVoucher();
    voucher.setCode(code);
    voucher.setType(type);
    voucher.setValidUntil(validUntil);
    return voucher;
  }
}
