package com.engine.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OBDDataDTO {
    @NotNull private Double map;
    @NotNull private Double tps;
    @NotNull private Double force;
    @NotNull private Double power;
    @NotNull private Double rpm;
    @NotNull private Double consumptionLH;
    @NotNull private Double consumptionL100km;
    @NotNull private Double speed;
    @NotNull private Double co;
    @NotNull private Double hc;
    @NotNull private Double co2;
    @NotNull private Double o2;
    @NotNull private Double lambda;
    @NotNull private Double afr;
}
