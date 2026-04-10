package com.engine.platform.service;

import com.engine.platform.dto.OBDDataDTO;
import com.engine.platform.entity.*;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.ml.EngineReadingRequest;
import com.engine.platform.ml.FastApiClient;
import com.engine.platform.ml.PredictionResponse;
import com.engine.platform.repository.BookingRepository;
import com.engine.platform.repository.OBDDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiagnosticService {

    private static final List<String> FAULT_LABELS = List.of(
            "Normal/Baseline Operation",
            "Rich Mixture Problems",
            "Combustion Efficiency Problems (Misfire/Lean)"
    );

    private final OBDDataRepository obdDataRepository;
    private final BookingRepository bookingRepository;
    private final FastApiClient fastApiClient;

    /**
     * Submit diagnostic for a booking.
     * Only the assigned mechanic (identity from JWT) may submit.
     */
    public OBDData saveDiagnostic(Long bookingId, OBDDataDTO dto, User mechanic) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        // Only the assigned mechanic may submit diagnostics
        if (booking.getMechanic() == null
                || !booking.getMechanic().getId().equals(mechanic.getId())) {
            throw new AppExceptions.ForbiddenException(
                    "Only the assigned mechanic can submit diagnostics for this booking");
        }

        // Booking must be in progress or confirmed
        if (booking.getStatus() != BookingStatus.IN_PROGRESS
                && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppExceptions.BadRequestException(
                    "Diagnostics can only be submitted for IN_PROGRESS or CONFIRMED bookings");
        }

        // Call ML service
        EngineReadingRequest mlRequest = buildRequest(dto);
        PredictionResponse prediction;
        try {
            prediction = fastApiClient.predict(mlRequest);
        } catch (Exception e) {
            throw new AppExceptions.BadRequestException(
                    "ML service unavailable or returned an error: " + e.getMessage());
        }

        // Bounds-check the predicted fault index.
        // -1 is used as a sentinel value to indicate an out-of-range or null prediction.
        // Downstream code (e.g., PDF report) should treat predictedFault == -1 as "Unknown Fault".
        String faultLabel;
        Integer predictedFault = prediction.getPredictedFault();
        if (predictedFault == null || predictedFault < 0 || predictedFault >= FAULT_LABELS.size()) {
            faultLabel = "Unknown Fault";
            predictedFault = -1;
        } else {
            faultLabel = FAULT_LABELS.get(predictedFault);
        }

        // Persist diagnostic result (one per booking; conflict if already exists)
        if (obdDataRepository.existsByBookingId(bookingId)) {
            throw new AppExceptions.ConflictException(
                    "Diagnostic already submitted for booking id: " + bookingId);
        }

        OBDData data = new OBDData();
        data.setBooking(booking);
        data.setMap(dto.getMap());
        data.setTps(dto.getTps());
        data.setForce(dto.getForce());
        data.setPower(dto.getPower());
        data.setRpm(dto.getRpm());
        data.setConsumptionLH(dto.getConsumptionLH());
        data.setConsumptionL100KM(dto.getConsumptionL100KM());
        data.setSpeed(dto.getSpeed());
        data.setCo(dto.getCo());
        data.setHc(dto.getHc());
        data.setCo2(dto.getCo2());
        data.setO2(dto.getO2());
        data.setLambda(dto.getLambda());
        data.setAfr(dto.getAfr());
        data.setPredictedFault(predictedFault);
        data.setFaultDescription(faultLabel);
        data.setConfidence(prediction.getConfidence());

        return obdDataRepository.save(data);
    }

    /**
     * Get diagnostic for a booking.
     * Accessible by both the booking client and the assigned mechanic.
     */
    public OBDData getDiagnostic(Long bookingId, User user) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));
        assertClientOrMechanic(booking, user);
        return obdDataRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AppExceptions.ResourceNotFoundException(
                        "No diagnostic found for booking id: " + bookingId));
    }

    // ---- internal helpers ----

    private void assertClientOrMechanic(Booking booking, User user) {
        boolean isClient = booking.getClient().getId().equals(user.getId());
        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(user.getId());
        if (!isClient && !isMechanic) {
            throw new AppExceptions.ForbiddenException(
                    "Access denied: not the booking client or assigned mechanic");
        }
    }

    private EngineReadingRequest buildRequest(OBDDataDTO dto) {
        return new EngineReadingRequest(
                dto.getMap(), dto.getTps(), dto.getForce(), dto.getPower(), dto.getRpm(),
                dto.getConsumptionLH(), dto.getConsumptionL100KM(), dto.getSpeed(),
                dto.getCo(), dto.getHc(), dto.getCo2(), dto.getO2(), dto.getLambda(), dto.getAfr()
        );
    }
}
