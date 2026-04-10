package com.engine.platform.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PredictionResponse {

    @JsonProperty("predicted_fault")
    private Integer predictedFault;

    @JsonProperty("fault_description")
    private String faultDescription;

    @JsonProperty("confidence")
    private Double confidence;
}
