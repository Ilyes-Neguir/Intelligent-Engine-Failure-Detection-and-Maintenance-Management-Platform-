package com.engine.platform.client;

import com.engine.platform.dto.EngineReadingRequest;
import com.engine.platform.dto.PredictionResponse;
import com.engine.platform.exception.AppExceptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Single ML client for the FastAPI prediction service.
 * Uses spring-boot RestClient (Spring 6.1+).
 */
@Component
public class FastApiClient {

    private final RestClient restClient;

    public FastApiClient(@Value("${ml.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public String testConnection() {
        try {
            return restClient.get()
                    .uri("/")
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException e) {
            throw new AppExceptions.BadRequestException("ML service unavailable: " + e.getMessage());
        }
    }

    public PredictionResponse predict(EngineReadingRequest request) {
        try {
            return restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(PredictionResponse.class);
        } catch (RestClientException e) {
            throw new AppExceptions.BadRequestException("ML prediction failed: " + e.getMessage());
        }
    }
}
