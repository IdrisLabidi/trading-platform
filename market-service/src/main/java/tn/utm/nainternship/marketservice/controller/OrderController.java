package tn.utm.nainternship.marketservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import tn.utm.nainternship.marketservice.dto.OrderRequest;
import tn.utm.nainternship.marketservice.dto.OrderResponse;
import tn.utm.nainternship.marketservice.service.OrderService;

import jakarta.validation.Valid;

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
}
