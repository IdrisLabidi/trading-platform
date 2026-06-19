package tn.utm.nainternship.portfolioservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.utm.nainternship.portfolioservice.entity.Order;

import java.util.List;
import java.util.UUID;

/**
 * Repository Spring Data JPA pour les ordres enregistrés localement.
 *
 * Il permet :
 *  - la persistance des ordres créés par l'utilisateur ;
 *  - la consultation de l'historique par utilisateur, utile pour le frontend.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    /** Récupère tous les ordres d'un utilisateur, triés du plus récent au plus ancien côté service. */
    List<Order> findAllByUserId(String userId);
}
