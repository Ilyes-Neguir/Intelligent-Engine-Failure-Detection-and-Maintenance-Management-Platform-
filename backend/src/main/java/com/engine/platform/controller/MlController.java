package com.engine.platform.controller;

import com.engine.platform.ml.FastApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ml")
@RequiredArgsConstructor
public class MlController {

    private final FastApiClient fastApiClient;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok(fastApiClient.test());
    }
}
