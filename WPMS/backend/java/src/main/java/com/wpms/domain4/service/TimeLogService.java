package com.wpms.domain4.service;

import com.wpms.domain4.model.TimeLog;
import com.wpms.domain4.repository.TimeLogRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;

public class TimeLogService {

    private final TimeLogRepository repository;

    public TimeLogService() {
        this.repository = new TimeLogRepository();
    }

    public TimeLog startTimer(
            long taskId,
            long userId) throws SQLException {

        LocalDateTime now =
                LocalDateTime.now();

        return repository.startTimeLog(
                taskId,
                userId,
                Timestamp.valueOf(now)
        );
    }

    public void stopTimer(
            long timeLogId) throws SQLException {

        TimeLog timeLog =
                repository.findById(timeLogId);

        if (timeLog == null) {
            throw new IllegalArgumentException(
                    "Time log does not exist."
            );
        }

        if (timeLog.getEndedAt() != null) {
            throw new IllegalStateException(
                    "Time log has already been stopped."
            );
        }

        LocalDateTime endedAt =
                LocalDateTime.now();

        Duration duration =
                Duration.between(
                        timeLog.getStartedAt(),
                        endedAt
                );

        BigDecimal hours =
                BigDecimal.valueOf(
                        duration.toSeconds() / 3600.0
                ).setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        repository.stopTimeLog(
                timeLogId,
                Timestamp.valueOf(endedAt),
                hours
        );
    }

    public BigDecimal getTaskActualHours(
            long taskId) throws SQLException {

        return repository.getTotalDurationForTask(
                taskId
        );
    }

    public BigDecimal getUserActualHours(
            long userId) throws SQLException {

        return repository.getTotalDurationForUser(
                userId
        );
    }
}