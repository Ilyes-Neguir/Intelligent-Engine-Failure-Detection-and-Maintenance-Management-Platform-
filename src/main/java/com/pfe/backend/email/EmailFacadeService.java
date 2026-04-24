package com.pfe.backend.email;

import com.pfe.backend.dto.BookingConfirmationEmailRequest;
import com.pfe.backend.dto.ReportReadyEmailRequest;
import com.pfe.backend.exception.EmailDispatchException;
import com.pfe.backend.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailFacadeService {

    private final EmailService emailService;

    public void sendBookingConfirmationEmail(BookingConfirmationEmailRequest request, Authentication authentication) {
        extractAuthenticatedUser(authentication);

        try {
            emailService.sendBookingConfirmation(
                    request.getTo(),
                    request.getClientName(),
                    request.getScheduledTime()
            );
        } catch (MailException ex) {
            throw EmailDispatchException.deliveryFailed("Failed to send booking confirmation email.");
        }
    }

    public void sendReportReadyEmail(ReportReadyEmailRequest request, Authentication authentication) {
        User user = extractAuthenticatedUser(authentication);

        try {
            emailService.sendReportReady(
                    request.getTo(),
                    request.getClientName(),
                    request.getBookingId()
            );
        } catch (MailException ex) {
            throw EmailDispatchException.deliveryFailed("Failed to send report-ready email.");
        }
    }

    private User extractAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw EmailDispatchException.unauthorized("Authentication is required.");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User user)) {
            throw EmailDispatchException.unauthorized("Invalid authentication principal.");
        }

        return user;
    }
}