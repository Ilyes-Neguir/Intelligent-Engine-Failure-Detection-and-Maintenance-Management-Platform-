package com.pfe.backend.ml.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PredictionResultResponse(
        @JsonProperty("predicted_fault") int predictedFault,
        @JsonProperty("fault_description") String faultDescription,
        @JsonProperty("confidence") double confidence
) {}
