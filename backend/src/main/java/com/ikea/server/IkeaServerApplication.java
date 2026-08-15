package com.ikea.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IkeaServerApplication {

  public static void main(String[] args) {
    SpringApplication.run(IkeaServerApplication.class, args);
  }
}
