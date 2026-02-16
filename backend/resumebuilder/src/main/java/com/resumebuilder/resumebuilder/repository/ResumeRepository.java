package com.resumebuilder.repository;

import com.resumebuilder.model.Resume;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ResumeRepository extends MongoRepository<Resume, String> {

    List<Resume> findByUserEmail(String userEmail);
}
