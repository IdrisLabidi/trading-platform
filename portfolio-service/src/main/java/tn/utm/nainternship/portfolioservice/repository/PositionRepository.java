package tn.utm.nainternship.portfolioservice.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.utm.nainternship.portfolioservice.entity.Position;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository Spring Data JPA pour les positions détenues par un trader.
 *
 *  - findByUserIdAndSymbol : accès direct à une position précise ;
 *  - findByUserIdAndSymbolForUpdate : variante verrouillée (SELECT ... FOR UPDATE)
 *    utilisée lors d'un ordre SELL pour empêcher deux ventes concurrentes sur
 *    la même position de dépasser la quantité réellement détenue ;
 *  - findAllByUserId : récupère l'ensemble des positions d'un utilisateur
 *    (utile pour afficher son portefeuille complet côté frontend).
 */
@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {

    Optional<Position> findByUserIdAndSymbol(String userId, String symbol);

    List<Position> findAllByUserId(String userId);

    /**
     * Variante verrou pessimiste pour sérialiser les écritures sur une position
     * lors d'un ordre SELL. Hibernate traduit cela en SELECT ... FOR UPDATE.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Position p WHERE p.userId = :userId AND p.symbol = :symbol")
    Optional<Position> findByUserIdAndSymbolForUpdate(@Param("userId") String userId,
                                                      @Param("symbol") String symbol);
}
