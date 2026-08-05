package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.PaymentTransaction;
import com.scholarlinkgh.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByPaystackReference(String reference);
    Page<PaymentTransaction> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    Page<PaymentTransaction> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<PaymentTransaction> findByUser_EmailContainingIgnoreCaseOrderByCreatedAtDesc(String email, Pageable pageable);
    
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amountPesewas), 0) FROM PaymentTransaction p WHERE p.user = :user AND p.status = 'SUCCESS'")
    Long sumAmountByUser(@org.springframework.data.repository.query.Param("user") User user);
    
    long countByUser(User user);
    java.util.List<PaymentTransaction> findByUser(User user);
}
