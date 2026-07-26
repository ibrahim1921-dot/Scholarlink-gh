package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.Notification;
import com.scholarlinkgh.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    long countByUserAndIsReadFalse(User user);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    void markAllAsReadByUser(@Param("user") User user);
    
    // For deduplication checks
    boolean existsByUserAndTypeAndRelatedScholarshipIdAndCreatedAtAfter(
        User user, String type, Long relatedScholarshipId, LocalDateTime createdAt
    );

    boolean existsByUserAndTypeAndCreatedAtAfter(
        User user, String type, LocalDateTime createdAt
    );
    void deleteAllByUser(User user);
}
