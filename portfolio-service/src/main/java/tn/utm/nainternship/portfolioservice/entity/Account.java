package tn.utm.nainternship.portfolioservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Représente le compte cash d'un utilisateur (trader) sur la plateforme.
 *
 * Le userId correspond à la claim "sub" du token JWT émis par Keycloak,
 * ce qui permet d'identifier de façon unique chaque trader dans tout le système.
 *
 * Champs importants :
 *  - cashBalance     : solde réellement disponible (peut être débité).
 *  - frozenBalance   : partie du solde déjà réservée par des ordres BUY en attente
 *                     d'exécution. Cette valeur ne peut pas être réutilisée tant
 *                     que l'ordre n'est pas annulé ou exécuté (anti double-spending).
 *
 * Le couple (cashBalance, frozenBalance) reflète l'état financier "libre"
 * vs "bloqué" d'un utilisateur pour le passage d'ordres d'achat.
 */
@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    /** Identifiant unique de l'utilisateur (claim "sub" du JWT Keycloak). */
    @Id
    @Column(name = "user_id", nullable = false)
    private String userId;

    /** Solde cash effectivement disponible pour de nouveaux achats. */
    @Column(name = "cash_balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal cashBalance;

    /**
     * Montant "gelé" pour couvrir des ordres BUY en cours.
     * Tant que ce montant n'est pas libéré, l'utilisateur ne peut pas le
     * réutiliser pour passer d'autres ordres d'achat : c'est ce qui empêche
     * le double-spending (deux requêtes d'achat concurrentes).
     */
    @Column(name = "frozen_balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal frozenBalance;

    /**
     * Champ technique utilisé par JPA pour la gestion optimiste de la concurrence.
     * Toute modification concurrente détectée par Hibernate déclenchera une
     * OptimisticLockException, ce qui protège le solde lors d'accès simultanés.
     */
    @Version
    @Column(name = "version")
    private Long version;
}
