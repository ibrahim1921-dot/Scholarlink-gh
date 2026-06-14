package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.RefreshToken;
import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    List<RefreshToken> findAllByUserAndRevokedAtIsNull(User user);

    Optional<RefreshToken> findFirstByUserAndRevokedAtIsNullOrderByCreatedAtDesc(User user);

    List<RefreshToken> findAllByExpiresAtBefore(LocalDateTime cutoff);
}
