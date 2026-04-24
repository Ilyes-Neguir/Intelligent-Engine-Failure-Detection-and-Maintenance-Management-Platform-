package com.pfe.backend.ml.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EngineReadingRequest(
        double map,
        double tps,
        double force,
        double power,
        double rpm,
        double consumptionlh,
        double consumptionl100km,
        double speed,
        double co,
        double hc,
        double co2,
        double o2,
        @JsonProperty("lambda_") double lambda_,
        double afr
) {}