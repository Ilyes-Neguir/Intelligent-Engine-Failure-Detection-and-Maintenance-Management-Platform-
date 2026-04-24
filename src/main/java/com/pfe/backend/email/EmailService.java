package com.pfe.backend.email;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendBookingConfirmation(String to, String clientName, String scheduledTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Booking Confirmed");
        message.setText(
                "Dear " + clientName + ",\n\n" +
                        "Your booking has been confirmed for " + scheduledTime + ".\n\n" +
                        "Thank you for choosing our service."
        );
        mailSender.send(message);
    }

    public void sendReportReady(String to, String clientName, Long bookingId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Diagnostic Report Ready");
        message.setText(
                "Dear " + clientName + ",\n\n" +
                        "Your diagnostic report for booking #" + bookingId + " is now ready.\n\n" +
                        "You can download it from your dashboard."
        );
        mailSender.send(message);
    }
}