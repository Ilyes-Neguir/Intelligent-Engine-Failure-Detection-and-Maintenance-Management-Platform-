package com.pfe.backend.diagnostic;

import com.pfe.backend.booking.Booking;
import com.pfe.backend.booking.BookingRepository;
import com.pfe.backend.booking.BookingStatus;
import com.pfe.backend.diagnostic.dto.OBDDataDTO;
import com.pfe.backend.diagnostic.dto.OBDDataResponseDTO;
import com.pfe.backend.exception.*;
import com.pfe.backend.ml.FastApiClient;
import com.pfe.backend.ml.dto.EngineReadingRequest;
import com.pfe.backend.ml.dto.PredictionResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class DiagnosticService {

    private final OBDDataRepository obdDataRepository;
    private final BookingRepository bookingRepository;
    private final FastApiClient fastApiClient;
    private final DiagnosticMapper diagnosticMapper;

    public OBDDataResponseDTO saveDiagnosticDto(Long bookingId, OBDDataDTO dto, Authentication authentication) throws IOException {
        return diagnosticMapper.toDto(saveDiagnostic(bookingId, dto, authentication));
    }

    public OBDDataResponseDTO getDiagnosticByBookingIdDto(Long bookingId, Authentication authentication) {
        return diagnosticMapper.toDto(getDiagnosticByBookingId(bookingId, authentication));
    }

    public OBDData saveDiagnostic(Long bookingId, OBDDataDTO dto, Authentication authentication) throws IOException {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        String currentEmail = authentication.getName();

        if (booking.getMechanic() == null || !booking.getMechanic().getEmail().equals(currentEmail)) {
            throw new MechanicAssignmentException("Only assigned mechanic can submit diagnostic data.");
        }

        if (booking.getStatus() != BookingStatus.IN_PROGRESS && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new InvalidBookingTransitionException(
                    "Booking must be IN_PROGRESS or CONFIRMED for diagnostics. Current status: " + booking.getStatus());
        }

        EngineReadingRequest request = new EngineReadingRequest(
                dto.getMap(), dto.getTps(), dto.getForce(), dto.getPower(), dto.getRpm(),
                dto.getConsumptionlh(), dto.getConsumptionl100km(), dto.getSpeed(),
                dto.getCo(), dto.getHc(), dto.getCo2(), dto.getO2(), dto.getLambda(), dto.getAfr()
        );

        PredictionResultResponse prediction = fastApiClient.predict(request);

        String faultDescription = prediction.faultDescription();
        if (faultDescription == null || faultDescription.isBlank()) {
            throw new InvalidPredictionException(
                    "ML returned no fault description for predicted_fault: " + prediction.predictedFault());
        }

        OBDData obdData = new OBDData();
        obdData.setMap(dto.getMap());
        obdData.setTps(dto.getTps());
        obdData.setForce(dto.getForce());
        obdData.setPower(dto.getPower());
        obdData.setRpm(dto.getRpm());
        obdData.setConsumptionlh(dto.getConsumptionlh());
        obdData.setConsumptionl100km(dto.getConsumptionl100km());
        obdData.setSpeed(dto.getSpeed());
        obdData.setCo(dto.getCo());
        obdData.setHc(dto.getHc());
        obdData.setCo2(dto.getCo2());
        obdData.setO2(dto.getO2());
        obdData.setLambda(dto.getLambda());
        obdData.setAfr(dto.getAfr());

        obdData.setPredictedFault(faultDescription);
        obdData.setConfidenceScore(prediction.confidence());
        obdData.setBooking(booking);

        return obdDataRepository.save(obdData);
    }

    public OBDData getDiagnosticByBookingId(Long bookingId, Authentication authentication) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(bookingId));

        String currentEmail = authentication.getName();
        boolean clientAllowed = booking.getClient() != null && booking.getClient().getEmail().equals(currentEmail);
        boolean mechanicAllowed = booking.getMechanic() != null && booking.getMechanic().getEmail().equals(currentEmail);

        if (!clientAllowed && !mechanicAllowed) {
            throw new ForbiddenOperationException("DIAGNOSTIC", "READ", "You are not allowed to access this diagnostic.");
        }

        return obdDataRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new DiagnosticNotFoundException(bookingId));
    }
}