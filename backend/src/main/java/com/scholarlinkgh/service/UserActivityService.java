package com.scholarlinkgh.service;

import com.scholarlinkgh.entity.User;
import com.scholarlinkgh.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserRepository userRepository;

    @Value("${security.inactivity-timeout-minutes:30}")
    private long inactivityTimeoutMinutes;

    public boolean isInactive(User user) {
        LocalDateTime lastActivity = user.getLastActivityAt();
        if (lastActivity == null) {
            return false;
        }
        long minutes = ChronoUnit.MINUTES.between(lastActivity, LocalDateTime.now());
        return minutes > inactivityTimeoutMinutes;
    }

    @Transactional
    public void touch(User user) {
        user.setLastActivityAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
