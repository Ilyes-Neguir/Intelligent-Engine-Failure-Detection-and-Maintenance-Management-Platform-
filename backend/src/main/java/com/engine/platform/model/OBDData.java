package com.engine.platform.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "obd_data")
public class OBDData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    private Double map;
    private Double tps;
    private Double force;
    private Double power;
    private Double rpm;
    private Double consumptionLH;
    private Double consumptionL100km;
    private Double speed;
    private Double co;
    private Double hc;
    private Double co2;
    private Double o2;
    private Double lambda;
    private Double afr;

    private Integer predictedFault;
    private Double confidence;
    private String faultLabel;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
