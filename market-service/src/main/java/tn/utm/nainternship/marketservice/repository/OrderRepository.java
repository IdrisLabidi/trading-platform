package tn.utm.nainternship.marketservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.utm.nainternship.marketservice.entity.OrderEntity;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    List<OrderEntity> findBySymbol(String symbol);

    List<OrderEntity> findByStatusInOrderByCreatedAtAsc(List<OrderEntity.Status> statuses);
}

