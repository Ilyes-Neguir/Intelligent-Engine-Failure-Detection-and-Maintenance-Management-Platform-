package com.engine.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OBDDataDTO {

    @NotNull(message = "MAP is required")
    private Double map;

    @NotNull(message = "TPS is required")
    private Double tps;

    @NotNull(message = "Force is required")
    private Double force;

    @NotNull(message = "Power is required")
    private Double power;

    @NotNull(message = "RPM is required")
    private Double rpm;

    @NotNull(message = "Consumption L/H is required")
    private Double consumptionLH;

    @NotNull(message = "Consumption L/100KM is required")
    private Double consumptionL100KM;

    @NotNull(message = "Speed is required")
    private Double speed;

    @NotNull(message = "CO is required")
    private Double co;

    @NotNull(message = "HC is required")
    private Double hc;

    @NotNull(message = "CO2 is required")
    private Double co2;

    @NotNull(message = "O2 is required")
    private Double o2;

    @NotNull(message = "Lambda is required")
    private Double lambda;

    @NotNull(message = "AFR is required")
    private Double afr;
}
