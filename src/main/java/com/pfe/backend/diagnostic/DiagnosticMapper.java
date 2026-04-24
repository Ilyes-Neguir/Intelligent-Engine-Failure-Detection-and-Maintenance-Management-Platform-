package com.pfe.backend.diagnostic;

import com.pfe.backend.diagnostic.dto.OBDDataResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class DiagnosticMapper {

    public OBDDataResponseDTO toDto(OBDData d) {
        return OBDDataResponseDTO.builder()
                .id(d.getId())
                .bookingId(d.getBooking() != null ? d.getBooking().getId() : null)
                .map(d.getMap())
                .tps(d.getTps())
                .force(d.getForce())
                .power(d.getPower())
                .rpm(d.getRpm())
                .consumptionlh(d.getConsumptionlh())
                .consumptionl100km(d.getConsumptionl100km())
                .speed(d.getSpeed())
                .co(d.getCo())
                .hc(d.getHc())
                .co2(d.getCo2())
                .o2(d.getO2())
                .lambda(d.getLambda())
                .afr(d.getAfr())
                .predictedFault(d.getPredictedFault())
                .confidenceScore(d.getConfidenceScore())
                .createdAt(d.getCreatedAt())
                .build();
    }
}