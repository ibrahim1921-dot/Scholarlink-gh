package com.scholarlinkgh.repository;

import com.scholarlinkgh.entity.AdminNote;
import com.scholarlinkgh.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminNoteRepository extends JpaRepository<AdminNote, Long> {
    Page<AdminNote> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    java.util.List<AdminNote> findByUser(User user);
    java.util.List<AdminNote> findByAdmin(User admin);
}
