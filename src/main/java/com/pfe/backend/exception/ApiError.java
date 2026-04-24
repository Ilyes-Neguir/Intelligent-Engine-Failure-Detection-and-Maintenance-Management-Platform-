package com.pfe.backend.exception;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ApiError {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String errorCode;
    private String entity;
    private String action;
    private String message;
    private Map<String, Object> details;
    private String path;
}