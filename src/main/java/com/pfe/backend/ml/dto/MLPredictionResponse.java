package com.pfe.backend.ml.dto;

import lombok.Data;

@Data
public class MLPredictionResponse {
    private int prediction;
    private double confidence;
}