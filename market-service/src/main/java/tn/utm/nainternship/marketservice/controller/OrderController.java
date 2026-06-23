package tn.utm.nainternship.marketservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import tn.utm.nainternship.marketservice.dto.OrderDetailsResponse;
import tn.utm.nainternship.marketservice.dto.OrderRequest;
import tn.utm.nainternship.marketservice.dto.OrderResponse;
import tn.utm.nainternship.marketservice.dto.OrderUpdateRequest;
import tn.utm.nainternship.marketservice.service.OrderBookSnapshot;
import tn.utm.nainternship.marketservice.service.OrderService;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Validated
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public OrderResponse submitOrder(@Valid @RequestBody OrderRequest request) {
        return orderService.submitOrder(request);
    }

    @GetMapping("/book/{symbol}")
    public OrderBookSnapshot getOrderBookBySymbol(@PathVariable String symbol) {
        return orderService.getOrderBookBySymbol(symbol);
    }

    @GetMapping("/{orderId}")
    public OrderDetailsResponse getOrderById(@PathVariable String orderId) {
        return orderService.getOrderById(orderId);
    }

    @GetMapping("/users/{userId}")
    public List<OrderDetailsResponse> getOrdersByUser(@PathVariable String userId) {
        return orderService.getOrdersByUser(userId);
    }

    @GetMapping("/users/{userId}/book")
    public List<OrderDetailsResponse> getOpenOrdersByUser(@PathVariable String userId) {
        return orderService.getOpenOrdersByUser(userId);
    }

    @PutMapping("/{orderId}")
    public OrderResponse updateOrder(@PathVariable String orderId,
                                     @Valid @RequestBody OrderUpdateRequest request) {
        return orderService.updateOrder(orderId, request);
    }

    @DeleteMapping("/{orderId}")
    public OrderResponse cancelOrder(@PathVariable String orderId) {
        return orderService.cancelOrder(orderId);
    }
}
