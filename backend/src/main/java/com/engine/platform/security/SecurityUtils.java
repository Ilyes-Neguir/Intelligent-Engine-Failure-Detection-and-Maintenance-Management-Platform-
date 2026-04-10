package com.engine.platform.security;

import com.engine.platform.exception.AppExceptions;
import com.engine.platform.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Helper that extracts the authenticated user's identity from the SecurityContext.
 * Controllers and services must use this instead of trusting path/query parameters.
 */
@Component
public class SecurityUtils {

    /**
     * Returns the authenticated User from the SecurityContext.
     * Throws UnauthorizedException if no authentication exists.
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User)) {
            throw new AppExceptions.UnauthorizedException("Not authenticated");
        }
        return (User) authentication.getPrincipal();
    }

    /**
     * Returns the authenticated user's ID from the SecurityContext.
     */
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Returns the authenticated user's role as a string.
     */
    public String getCurrentUserRole() {
        return getCurrentUser().getRole().name();
    }

    /**
     * Asserts the currently authenticated user's ID matches the expected ID.
     * Throws ForbiddenException if they do not match.
     */
    public void assertCurrentUser(Long expectedUserId) {
        if (!getCurrentUserId().equals(expectedUserId)) {
            throw new AppExceptions.ForbiddenException("Access denied: you are not authorized to perform this action");
        }
    }
}
