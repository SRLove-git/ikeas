package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherResponse;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherResponse;
import com.ikea.server.entity.ExperienceVoucher;
import com.ikea.server.service.ExperienceVoucherService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/experience-vouchers")
public class ExperienceVoucherController {

  private final ExperienceVoucherService voucherService;

  public ExperienceVoucherController(ExperienceVoucherService voucherService) {
    this.voucherService = voucherService;
  }

  @PostMapping("/validate")
  public ValidateVoucherResponse validate(@RequestBody ValidateVoucherRequest request) {
    return voucherService.validate(request.code());
  }

  @GetMapping("/mine")
  public List<ExperienceVoucher> mine(HttpServletRequest request) {
    return voucherService.listUserVouchers(userId(request));
  }

  /** 导出当前登录用户自己的积分券 PDF（使用积分券 A4 模板叠加券码与二维码）。 */
  @GetMapping("/mine.pdf")
  public ResponseEntity<byte[]> minePdf(HttpServletRequest request) {
    Long uid = userId(request);
    List<String> codes = voucherService.listUserPointsVoucherCodes(uid);
    if (codes.isEmpty()) {
      throw new IllegalArgumentException("您还没有可导出的积分券");
    }
    byte[] pdf = voucherService.generatePdf(codes);
    String filename = voucherService.pdfFilename(codes);
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(filename).build().toString())
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdf);
  }

  @PostMapping("/redeem")
  public RedeemVoucherResponse redeem(@RequestBody RedeemVoucherRequest request) {
    if (request.codes() != null && !request.codes().isEmpty()) {
      String bookingId = request.bookingId() == null ? "" : request.bookingId();
      String codes =
          voucherService.redeemPointVouchersForBooking(request.codes(), bookingId);
      return new RedeemVoucherResponse(codes, bookingId);
    }
    return voucherService.redeem(request.code(), request.bookingId());
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value == null) {
      throw new UnauthorizedException("请先登录");
    }
    return Long.valueOf(value);
  }
}
