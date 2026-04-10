package com.engine.platform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "obd_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OBDData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    // 14 OBD features
    private Double map;
    private Double tps;
    private Double force;
    private Double power;
    private Double rpm;
    private Double consumptionLH;
    private Double consumptionL100KM;
    private Double speed;
    private Double co;
    private Double hc;
    private Double co2;
    private Double o2;
    private Double lambda;
    private Double afr;

    // ML prediction result
    private Integer predictedFault;
    private String faultDescription;
    private Double confidence;

    private LocalDateTime timestamp;

    @PrePersist
    public void prePersist() {
        timestamp = LocalDateTime.now();
    }
}
