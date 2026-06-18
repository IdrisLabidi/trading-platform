package tn.utm.nainternship.marketservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.utm.nainternship.marketservice.orderbook.Order;
import tn.utm.nainternship.marketservice.service.OrderService;
import tn.utm.nainternship.marketservice.orderbook.Trade;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public void submitOrder(@RequestBody Order order) {
        orderService.processOrder(order);
    }

    @GetMapping("/trades")
    public List<Trade> getTrades() {
        return orderService.getTrades();
    }

    @GetMapping
    public String sayHello() {
        return "Hello World";
    }
}
