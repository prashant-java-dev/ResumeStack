package com.resumebuilder.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class RequestLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        // Basic logging. In production, be careful not to log sensitive body data without sanitization.
        logger.info("REQUEST: method={} uri={}", req.getMethod(), req.getRequestURI());
        
        long startTime = System.currentTimeMillis();
        chain.doFilter(request, response);
        long duration = System.currentTimeMillis() - startTime;
        
        logger.info("RESPONSE: method={} uri={} duration={}ms", req.getMethod(), req.getRequestURI(), duration);
    }
}
