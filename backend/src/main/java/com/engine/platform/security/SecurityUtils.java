package com.engine.platform.security;

import com.engine.platform.entity.User;
import com.engine.platform.exception.AppExceptions;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility to read the currently authenticated user from the SecurityContext.
 * Identity is always derived from the JWT — never from path variables.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the currently authenticated User from the SecurityContext.
     * Throws UnauthorizedException if no authentication is present.
     */
    public static User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            throw new AppExceptions.UnauthorizedException("Not authenticated");
        }
        return (User) auth.getPrincipal();
    }

    /**
     * Returns the ID of the currently authenticated user.
     */
    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Returns the role name of the currently authenticated user.
     */
    public static String getCurrentUserRole() {
        return getCurrentUser().getRole().name();
    }
}
