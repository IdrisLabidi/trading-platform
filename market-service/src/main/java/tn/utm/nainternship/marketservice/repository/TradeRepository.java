package tn.utm.nainternship.marketservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.utm.nainternship.marketservice.entity.TradeEntity;

@Repository
public interface TradeRepository extends JpaRepository<TradeEntity, String> {
}

