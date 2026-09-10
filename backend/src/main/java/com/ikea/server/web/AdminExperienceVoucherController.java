package com.ikea.server.web;

import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminCreateVouchersRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminGenerateVouchersRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminUpdateVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.GeneratePdfRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.VoucherClaimView;
import com.ikea.server.entity.ExperienceVoucher;
import com.ikea.server.service.ExperienceVoucherService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/experience-vouchers")
public class AdminExperienceVoucherController {

  private final ExperienceVoucherService voucherService;

  public AdminExperienceVoucherController(ExperienceVoucherService voucherService) {
    this.voucherService = voucherService;
  }

  @GetMapping
  public List<ExperienceVoucher> vouchers(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Integer status,
      @RequestParam(required = false) Integer type) {
    return voucherService.listVouchers(q, status, type);
  }

  @GetMapping("/claims")
  public List<VoucherClaimView> claims() {
    return voucherService.listVoucherClaims();
  }

  @DeleteMapping("/claims/{id}")
  public Map<String, Boolean> deleteClaim(@PathVariable Long id) {
    voucherService.deleteVoucherClaim(id);
    return Map.of("ok", true);
  }

  @PostMapping
  public List<ExperienceVoucher> createVouchers(@RequestBody AdminCreateVouchersRequest request) {
    return voucherService.createVouchers(request);
  }

  @PostMapping("/generate")
  public List<ExperienceVoucher> generateVouchers(
      @RequestBody AdminGenerateVouchersRequest request) {
    return voucherService.generateVouchers(request);
  }

  @PostMapping("/pdf")
  public ResponseEntity<byte[]> generatePdf(@RequestBody GeneratePdfRequest request) {
    List<String> codes = request == null ? List.of() : request.codes();
    byte[] pdf = voucherService.generatePdf(codes);
    String filename = voucherService.pdfFilename(codes);
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename(filename).build().toString())
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdf);
  }

  @PatchMapping("/{id}")
  public ExperienceVoucher updateVoucher(
      @PathVariable Long id, @RequestBody AdminUpdateVoucherRequest request) {
    return voucherService.updateVoucher(id, request);
  }

  @PatchMapping("/{id}/status")
  public Map<String, Boolean> updateStatus(
      @PathVariable Long id, @RequestBody Map<String, Integer> body) {
    voucherService.updateStatus(id, body.get("status"));
    return Map.of("ok", true);
  }

  @DeleteMapping("/{id}")
  public Map<String, Boolean> deleteVoucher(@PathVariable Long id) {
    voucherService.deleteVoucher(id);
    return Map.of("ok", true);
  }
}
