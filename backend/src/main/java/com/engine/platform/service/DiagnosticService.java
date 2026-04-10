package com.engine.platform.service;

import com.engine.platform.client.FastApiClient;
import com.engine.platform.dto.EngineReadingRequest;
import com.engine.platform.dto.OBDDataDTO;
import com.engine.platform.dto.PredictionResponse;
import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.Booking;
import com.engine.platform.model.BookingStatus;
import com.engine.platform.model.OBDData;
import com.engine.platform.model.User;
import com.engine.platform.repository.OBDDataRepository;
import com.engine.platform.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DiagnosticService {

    /**
     * Fault labels indexed by predicted_fault from ML model.
     * Index 0..2 are the only valid values from the model contract.
     */
    private static final String[] FAULT_LABELS = {
        "Normal/Baseline Operation",
        "Rich Mixture Problems",
        "Combustion Efficiency Problems (Misfire/Lean)"
    };

    private final OBDDataRepository obdDataRepository;
    private final BookingService bookingService;
    private final FastApiClient fastApiClient;
    private final SecurityUtils securityUtils;

    public DiagnosticService(OBDDataRepository obdDataRepository,
                              BookingService bookingService,
                              FastApiClient fastApiClient,
                              SecurityUtils securityUtils) {
        this.obdDataRepository = obdDataRepository;
        this.bookingService = bookingService;
        this.fastApiClient = fastApiClient;
        this.securityUtils = securityUtils;
    }

    /**
     * Save a diagnostic reading for a booking.
     * - mechanicId is derived from JWT (not from path).
     * - Validates that the calling mechanic is the one assigned to the booking.
     * - Validates booking status is IN_PROGRESS or CONFIRMED.
     * - Hardens ML response: bounds-checks predictedFault index before array lookup.
     */
    public OBDData saveDiagnostic(Long bookingId, OBDDataDTO dto) {
        User currentMechanic = securityUtils.getCurrentUser();
        Booking booking = bookingService.findByIdOrThrow(bookingId);

        // Verify the calling mechanic is assigned to this booking
        if (booking.getMechanic() == null || !booking.getMechanic().getId().equals(currentMechanic.getId())) {
            throw new AppExceptions.ForbiddenException(
                    "You are not the assigned mechanic for booking " + bookingId);
        }

        // Verify booking is in an acceptable state for diagnostics
        if (booking.getStatus() != BookingStatus.IN_PROGRESS
                && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new AppExceptions.BadRequestException(
                    "Diagnostics can only be performed on IN_PROGRESS or CONFIRMED bookings; "
                    + "current status: " + booking.getStatus());
        }

        // Build ML request
        EngineReadingRequest mlRequest = new EngineReadingRequest(
                dto.getMap(), dto.getTps(), dto.getForce(), dto.getPower(), dto.getRpm(),
                dto.getConsumptionLH(), dto.getConsumptionL100km(), dto.getSpeed(),
                dto.getCo(), dto.getHc(), dto.getCo2(), dto.getO2(), dto.getLambda(), dto.getAfr()
        );

        PredictionResponse prediction = fastApiClient.predict(mlRequest);

        // Bounds-check predictedFault to avoid ArrayIndexOutOfBoundsException
        Integer rawFault = prediction.getPredictedFault();
        String faultLabel;
        Integer storedFaultIndex;
        if (rawFault == null) {
            faultLabel = "No fault prediction available";
            storedFaultIndex = null;
        } else if (rawFault < 0 || rawFault >= FAULT_LABELS.length) {
            faultLabel = "Unknown fault (ML returned unexpected index: " + rawFault + ")";
            storedFaultIndex = null;
        } else {
            faultLabel = FAULT_LABELS[rawFault];
            storedFaultIndex = rawFault;
        }

        OBDData obdData = new OBDData();
        obdData.setBooking(booking);
        obdData.setMap(dto.getMap());
        obdData.setTps(dto.getTps());
        obdData.setForce(dto.getForce());
        obdData.setPower(dto.getPower());
        obdData.setRpm(dto.getRpm());
        obdData.setConsumptionLH(dto.getConsumptionLH());
        obdData.setConsumptionL100km(dto.getConsumptionL100km());
        obdData.setSpeed(dto.getSpeed());
        obdData.setCo(dto.getCo());
        obdData.setHc(dto.getHc());
        obdData.setCo2(dto.getCo2());
        obdData.setO2(dto.getO2());
        obdData.setLambda(dto.getLambda());
        obdData.setAfr(dto.getAfr());
        obdData.setPredictedFault(storedFaultIndex);
        obdData.setConfidence(prediction.getConfidence());
        obdData.setFaultLabel(faultLabel);

        return obdDataRepository.save(obdData);
    }

    /**
     * Get all diagnostic readings for a booking.
     * - Accessible only by the booking's assigned mechanic or client.
     */
    public List<OBDData> getDiagnosticsByBooking(Long bookingId) {
        Booking booking = bookingService.findByIdOrThrow(bookingId);
        User currentUser = securityUtils.getCurrentUser();

        boolean isMechanic = booking.getMechanic() != null
                && booking.getMechanic().getId().equals(currentUser.getId());
        boolean isClient = booking.getClient().getId().equals(currentUser.getId());

        if (!isMechanic && !isClient) {
            throw new AppExceptions.ForbiddenException("Access denied to diagnostics for booking " + bookingId);
        }

        return obdDataRepository.findByBookingId(bookingId);
    }
}
