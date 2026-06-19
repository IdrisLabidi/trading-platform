package tn.utm.nainternship.portfolioservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.utm.nainternship.portfolioservice.dto.BalanceResponse;
import tn.utm.nainternship.portfolioservice.entity.Account;
import tn.utm.nainternship.portfolioservice.exception.AccountNotFoundException;
import tn.utm.nainternship.portfolioservice.repository.AccountRepository;

import java.math.BigDecimal;

/**
 * Service métier responsable de la gestion des comptes cash des utilisateurs.
 *
 * Toute méthode qui modifie le solde utilise un verrou pessimiste (SELECT FOR UPDATE)
 * pour empêcher des courses critiques entre requêtes simultanées : sans verrou,
 * deux ordres d'achat concurrents pourraient chacun voir un solde suffisant
 * individuellement, alors que leur somme dépasse le solde réel.
 *
 * Le solde réellement disponible pour un nouvel achat est :
 *     availableBalance = cashBalance - frozenBalance
 * C'est la valeur retournée par getBalance() et utilisée par OrderService
 * pour valider un ordre BUY.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    /**
     * Renvoie la vue "solde" d'un utilisateur. Si le compte n'existe pas,
     * on en crée un à zéro plutôt que de renvoyer une erreur : cela permet
     * à un nouvel utilisateur de Keycloak d'accéder immédiatement à son
     * portefeuille sans étape d'initialisation manuelle.
     */
    @Transactional
    public BalanceResponse getBalance(String userId) {
        Account account = accountRepository.findByUserId(userId)
                .orElseGet(() -> createAccount(userId));
        return toResponse(account);
    }

    /**
     * Variante verrouillée de getBalance, à utiliser dans toute opération
     * qui suit une écriture (création d'ordre, gel de cash, etc.).
     */
    @Transactional
    public Account loadForUpdate(String userId) {
        return accountRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> createAccount(userId));
    }

    /**
     * Gèle un montant sur le compte cash d'un utilisateur.
     *
     * Le gel consiste à transférer "amount" depuis cashBalance vers
     * frozenBalance. Lève InsufficientFundsException (gérée par le
     * GlobalExceptionHandler → HTTP 400) si le solde disponible est insuffisant.
     *
     * @return Account mis à jour et persisté.
     */
    @Transactional
    public Account freezeCash(String userId, BigDecimal amount) {
        Account account = loadForUpdate(userId);
        BigDecimal available = account.getCashBalance().subtract(account.getFrozenBalance());

        if (available.compareTo(amount) < 0) {
            log.warn("Freeze refused for user={} amount={} available={}", userId, amount, available);
            throw new tn.utm.nainternship.portfolioservice.exception.InsufficientFundsException(
                    "Solde insuffisant pour geler " + amount + " (disponible=" + available + ")");
        }
        account.setCashBalance(account.getCashBalance().subtract(amount));
        account.setFrozenBalance(account.getFrozenBalance().add(amount));
        log.debug("Froze {} on user {} (new frozen={})", amount, userId, account.getFrozenBalance());
        return accountRepository.save(account);
    }

    /**
     * Libère un montant précédemment gelé. Utilisé lors d'une annulation d'ordre
     * ou après exécution si le montant n'a finalement pas été consommé.
     */
    @Transactional
    public Account releaseCash(String userId, BigDecimal amount) {
        Account account = loadForUpdate(userId);
        BigDecimal newFrozen = account.getFrozenBalance().subtract(amount);
        if (newFrozen.signum() < 0) {
            // sécurité : on ne libère jamais plus que ce qui est gelé
            newFrozen = BigDecimal.ZERO;
        }
        account.setFrozenBalance(newFrozen);
        account.setCashBalance(account.getCashBalance().add(amount));
        return accountRepository.save(account);
    }

    /**
     * Débite définitivement un montant précédemment gelé (ordre exécuté).
     * Aucun mouvement sur cashBalance : la portion gelée disparaît simplement
     * car elle est partie vers le vendeur.
     */
    @Transactional
    public Account consumeFrozenCash(String userId, BigDecimal amount) {
        Account account = loadForUpdate(userId);
        BigDecimal newFrozen = account.getFrozenBalance().subtract(amount);
        if (newFrozen.signum() < 0) {
            newFrozen = BigDecimal.ZERO;
        }
        account.setFrozenBalance(newFrozen);
        return accountRepository.save(account);
    }

    /** Crée un compte à zéro pour un nouvel utilisateur. */
    private Account createAccount(String userId) {
        Account account = Account.builder()
                .userId(userId)
                .cashBalance(BigDecimal.ZERO)
                .frozenBalance(BigDecimal.ZERO)
                .build();
        log.info("Creating new account for userId={}", userId);
        return accountRepository.save(account);
    }

    private BalanceResponse toResponse(Account account) {
        BigDecimal available = account.getCashBalance().subtract(account.getFrozenBalance());
        return new BalanceResponse(
                account.getUserId(),
                account.getCashBalance(),
                account.getFrozenBalance(),
                available
        );
    }

    /**
     * Variante lecture-seule (sans transaction d'écriture) utile aux contrôleurs
     * qui n'ont pas besoin de verrou : @Transactional(readOnly = true) permet
     * à Hibernate d'optimiser la session (flush désactivé, etc.).
     */
    @Transactional(readOnly = true)
    public BalanceResponse getBalanceReadOnly(String userId) {
        Account account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new AccountNotFoundException("Compte introuvable pour userId=" + userId));
        return toResponse(account);
    }
}
