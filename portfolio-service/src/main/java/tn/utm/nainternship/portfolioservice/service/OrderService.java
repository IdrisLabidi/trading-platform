package tn.utm.nainternship.portfolioservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.utm.nainternship.portfolioservice.client.MarketServiceClient;
import tn.utm.nainternship.portfolioservice.dto.CreateOrderRequest;
import tn.utm.nainternship.portfolioservice.dto.OrderResponse;
import tn.utm.nainternship.portfolioservice.entity.Order;
import tn.utm.nainternship.portfolioservice.model.OrderSide;
import tn.utm.nainternship.portfolioservice.model.OrderStatus;
import tn.utm.nainternship.portfolioservice.repository.OrderRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Orchestrateur de la création d'ordres côté portfolio-service.
 *
 * Responsabilités :
 *  1. Vérifier (de façon synchrone, via MarketServiceClient) la cohérence
 *     d'un ordre BUY avec le marché (le prix saisi est-il dans un ordre de
 *     grandeur raisonnable par rapport au dernier cours ?) ;
 *  2. Geler les ressources du trader pour empêcher le double-spending :
 *       - cash pour un BUY ;
 *       - actions pour un SELL ;
 *  3. Persister l'ordre en base en statut PENDING ;
 *  4. (Plus tard) transmettre l'ordre au market-service via Kafka pour le matching.
 *
 * L'annotation @Transactional garantit que le gel et l'insertion de l'ordre
 * sont atomiques : si une étape échoue, tout est annulé.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final AccountService accountService;
    private final PositionService positionService;
    private final MarketServiceClient marketServiceClient;

    /**
     * Crée un ordre en appliquant les règles anti double-spending.
     *
     * Pour un BUY :
     *   - on récupère le dernier prix marché ;
     *   - on calcule le coût total (price * quantity) ;
     *   - on gèle ce montant sur le compte cash ;
     *   - on enregistre l'ordre.
     *
     * Pour un SELL :
     *   - on gèle la quantité d'actions demandée sur la position ;
     *   - on enregistre l'ordre.
     */
    @Transactional
    public OrderResponse createOrder(String userId, CreateOrderRequest request) {
        log.info("Creating order user={} symbol={} side={} qty={} price={}",
                userId, request.symbol(), request.side(), request.quantity(), request.price());

        // 1) Vérification synchrone avec le market-service (cohérence prix).
        BigDecimal marketPrice = marketServiceClient.getLastPrice(request.symbol());
        // Ici on se contente de vérifier que le prix saisi est proche du marché
        // (à ±20%). Cette règle pourra être assouplie/durcie plus tard.
        BigDecimal lowerBound = marketPrice.multiply(BigDecimal.valueOf(0.8));
        BigDecimal upperBound = marketPrice.multiply(BigDecimal.valueOf(1.2));
        if (request.price().compareTo(lowerBound) < 0 || request.price().compareTo(upperBound) > 0) {
            throw new IllegalArgumentException(
                    "Le prix saisi (" + request.price() + ") est trop éloigné du marché ("
                            + marketPrice + ") pour le symbole " + request.symbol());
        }

        BigDecimal frozenAmount = request.price().multiply(BigDecimal.valueOf(request.quantity()));

        // 2) Gel des ressources selon le côté de l'ordre.
        if (request.side() == OrderSide.BUY) {
            accountService.freezeCash(userId, frozenAmount);
        } else {
            positionService.freezeShares(userId, request.symbol(), request.quantity());
        }

        // 3) Persistance de l'ordre en PENDING.
        Order order = Order.builder()
                .userId(userId)
                .symbol(request.symbol())
                .side(request.side())
                .quantity(request.quantity())
                .price(request.price())
                .frozenAmount(frozenAmount)
                .status(OrderStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        Order saved = orderRepository.save(order);

        // 4) TODO : publier l'ordre sur Kafka pour que le market-service le prenne en charge.
        //    Pour l'instant on reste en PENDING : l'ordre sera marqué EXECUTED
        //    par un listener Kafka lorsque le market-service publiera un Trade.

        return toResponse(saved);
    }

    /**
     * Annule un ordre PENDING : libère les ressources gelées et passe le statut à CANCELLED.
     */
    @Transactional
    public OrderResponse cancelOrder(String userId, UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Ordre introuvable : " + orderId));

        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Cet ordre n'appartient pas à l'utilisateur courant");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Seul un ordre PENDING peut être annulé (statut actuel : "
                    + order.getStatus() + ")");
        }

        if (order.getSide() == OrderSide.BUY) {
            accountService.releaseCash(userId, order.getFrozenAmount());
        } else {
            positionService.releaseShares(userId, order.getSymbol(), order.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        return toResponse(saved);
    }

    private OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getSymbol(),
                order.getSide(),
                order.getQuantity(),
                order.getPrice(),
                order.getFrozenAmount(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }
}
