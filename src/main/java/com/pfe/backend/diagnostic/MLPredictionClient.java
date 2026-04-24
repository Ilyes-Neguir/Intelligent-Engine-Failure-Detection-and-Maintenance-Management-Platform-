package com.pfe.backend.diagnostic;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pfe.backend.ml.dto.MLPredictionRequest;
import com.pfe.backend.ml.dto.MLPredictionResponse;
import lombok.RequiredArgsConstructor;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class MLPredictionClient {

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    private final ObjectMapper objectMapper;

    public MLPredictionResponse predict(double[] features) throws IOException {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost request = new HttpPost(mlServiceUrl + "/predict");

            MLPredictionRequest requestBody = new MLPredictionRequest(new double[][]{features});
            String json = objectMapper.writeValueAsString(requestBody);

            request.setEntity(new StringEntity(json));
            request.setHeader("Content-Type", "application/json");

            try (CloseableHttpResponse response = httpClient.execute(request)) {
                String responseBody = new String(response.getEntity().getContent().readAllBytes());
                return objectMapper.readValue(responseBody, MLPredictionResponse.class);
            }
        }
    }
}