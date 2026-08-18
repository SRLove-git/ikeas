package com.ikea.server.web;

import com.ikea.server.storage.OssStorageService;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Admin OSS upload/delete endpoints. Protected by /api/v1/admin/** admin key interceptor. */
@RestController
@RequestMapping("/api/v1/admin/oss")
public class OssController {

  private final OssStorageService ossStorageService;

  public OssController(OssStorageService ossStorageService) {
    this.ossStorageService = ossStorageService;
  }

  @PostMapping("/upload")
  public Map<String, Object> upload(
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "objectKey", required = false) String objectKey) {
    return ossStorageService.upload(file, objectKey);
  }

  @DeleteMapping
  public Map<String, Object> delete(@RequestParam("objectKey") String objectKey) {
    return ossStorageService.delete(objectKey);
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    return ossStorageService.status();
  }
}
