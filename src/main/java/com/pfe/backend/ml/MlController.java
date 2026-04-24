package com.pfe.backend.ml;

import com.pfe.backend.ml.dto.PredictionResultResponse;
import com.pfe.backend.ml.dto.EngineReadingRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ml")
@RequiredArgsConstructor
public class MlController {

    private final MlService mlService;

    @GetMapping("/test-connection")
    public String testMlConnection(Authentication authentication) {
        return mlService.testConnection();
    }

    @PostMapping("/predict")
    public PredictionResultResponse predict(Authentication authentication,
                                            @RequestBody EngineReadingRequest request) {
        return mlService.predict(request);
    }
}