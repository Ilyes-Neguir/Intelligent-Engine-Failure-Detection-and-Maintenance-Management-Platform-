package com.engine.platform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EngineReadingRequest {
    @JsonProperty("MAP")
    private Double map;

    @JsonProperty("TPS")
    private Double tps;

    @JsonProperty("Force")
    private Double force;

    @JsonProperty("Power")
    private Double power;

    @JsonProperty("RPM")
    private Double rpm;

    @JsonProperty("Consumption L/H")
    private Double consumptionLH;

    @JsonProperty("Consumption L/100KM")
    private Double consumptionL100km;

    @JsonProperty("Speed")
    private Double speed;

    @JsonProperty("CO")
    private Double co;

    @JsonProperty("HC")
    private Double hc;

    @JsonProperty("CO2")
    private Double co2;

    @JsonProperty("O2")
    private Double o2;

    @JsonProperty("Lambda")
    private Double lambda;

    @JsonProperty("AFR")
    private Double afr;
}
