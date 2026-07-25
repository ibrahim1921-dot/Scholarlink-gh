package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByPasswordResetToken(String tokenHash);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))")
    org.springframework.data.domain.Page<User> searchUsers(@org.springframework.data.repository.query.Param("search") String search, org.springframework.data.domain.Pageable pageable);

    long countByRole(com.scholarlinkgh.entity.Role role);
}