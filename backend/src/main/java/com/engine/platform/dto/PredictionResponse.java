package com.engine.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class PredictionResponse {
    @JsonProperty("predicted_fault")
    private Integer predictedFault;

    @JsonProperty("confidence")
    private Double confidence;

    @JsonProperty("fault_description")
    private String faultDescription;
}
