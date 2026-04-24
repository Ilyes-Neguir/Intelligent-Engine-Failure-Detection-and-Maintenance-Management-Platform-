package com.pfe.backend.ml;

import com.pfe.backend.exception.ExternalServiceException;
import com.pfe.backend.ml.dto.EngineReadingRequest;
import com.pfe.backend.ml.dto.PredictionResultResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import static org.springframework.http.MediaType.APPLICATION_JSON;

@Service
public class FastApiClient {
    private static final Logger log = LoggerFactory.getLogger(FastApiClient.class);
    private final RestClient restClient;

    public FastApiClient(RestClient.Builder restClientBuilder,
                         @Value("${ml.base-url}") String mlBaseUrl
    ) {
        this.restClient = restClientBuilder
                .baseUrl(mlBaseUrl)
                .build();
    }

    public String test() {
        return this.restClient
                .get()
                .uri("test")
                .retrieve()
                .body(String.class);
    }

    public PredictionResultResponse predict(EngineReadingRequest request) {
        try {
            return restClient.post()
                    .uri("predict")
                    .contentType(APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(PredictionResultResponse.class);

        } catch (RestClientResponseException ex) {
            log.error("FastAPI Error: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new ExternalServiceException("ML Service error: " + ex.getResponseBodyAsString());
        }
    }
}