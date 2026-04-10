package com.engine.platform.ml;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class FastApiClient {

    private final RestClient restClient;

    public FastApiClient(@Value("${ml.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public PredictionResponse predict(EngineReadingRequest request) {
        return restClient.post()
                .uri("/predict")
                .body(request)
                .retrieve()
                .body(PredictionResponse.class);
    }

    public String test() {
        return restClient.get()
                .uri("/health")
                .retrieve()
                .body(String.class);
    }
}
