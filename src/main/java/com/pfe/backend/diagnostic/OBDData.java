package com.pfe.backend.diagnostic;

import com.pfe.backend.booking.Booking;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
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

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    private Double map;
    private Double tps;
    private Double force;
    private Double power;
    private Double rpm;

    @Column(name = "consumption_lh")
    private Double consumptionlh;

    @Column(name = "consumption_l100km")
    private Double consumptionl100km;

    private Double speed;
    private Double co;
    private Double hc;

    @Column(name = "co2")
    private Double co2;

    @Column(name = "o2")
    private Double o2;

    @Column(name = "lambda_")
    private Double lambda;

    private Double afr;

    @Column(name = "predicted_fault")
    private String predictedFault;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}