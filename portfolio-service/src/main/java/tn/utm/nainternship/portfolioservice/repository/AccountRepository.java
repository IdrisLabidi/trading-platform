package tn.utm.nainternship.portfolioservice.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.utm.nainternship.portfolioservice.entity.Account;

import java.util.Optional;

/**
 * Repository Spring Data JPA pour l'entité Account.
 *
 * Il propose des méthodes dérivées classiques (par userId) ainsi qu'une
 * méthode {@link #findByUserIdForUpdate(String)} utilisant un verrou pessimiste
 * d'écriture (SELECT ... FOR UPDATE). Ce verrou est crucial lors du passage
 * d'un ordre BUY : il sérialise l'accès concurrent à la ligne Account pour
 * garantir que le calcul "solde disponible = cashBalance - frozenBalance"
 * et la mise à jour des soldes gelés se font de façon atomique.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    /** Recherche par identifiant utilisateur, sans verrou. */
    Optional<Account> findByUserId(String userId);

    /**
     * Recherche par identifiant utilisateur avec verrou pessimiste en écriture.
     * Hibernate émettra "SELECT ... FOR UPDATE" côté PostgreSQL.
     * À utiliser dans toute transaction qui modifie le solde ou le frozen.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.userId = :userId")
    Optional<Account> findByUserIdForUpdate(@Param("userId") String userId);
}
