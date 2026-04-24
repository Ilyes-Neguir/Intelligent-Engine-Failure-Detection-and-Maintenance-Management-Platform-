package com.pfe.backend.ml;

import com.pfe.backend.ml.dto.EngineReadingRequest;
import com.pfe.backend.ml.dto.PredictionResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MlService {

    private final FastApiClient fastApiClient;

    public String testConnection() {
        return fastApiClient.test();
    }
    public PredictionResultResponse predict(EngineReadingRequest request) {
        System.out.println("ML REQUEST => " + request);
        return fastApiClient.predict(request);
    }
}