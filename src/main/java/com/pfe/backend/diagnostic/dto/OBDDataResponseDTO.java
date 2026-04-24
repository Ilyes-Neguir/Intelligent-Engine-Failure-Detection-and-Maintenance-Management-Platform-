package com.pfe.backend.diagnostic.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OBDDataResponseDTO {
    private Long id;
    private Long bookingId;

    private Double map;
    private Double tps;
    private Double force;
    private Double power;
    private Double rpm;
    private Double consumptionlh;
    private Double consumptionl100km;
    private Double speed;
    private Double co;
    private Double hc;
    private Double co2;
    private Double o2;
    private Double lambda;
    private Double afr;

    private String predictedFault;
    private Double confidenceScore;
    private LocalDateTime createdAt;
}