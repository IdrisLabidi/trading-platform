package tn.utm.nainternship.assetservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.utm.nainternship.assetservice.dto.AssetResponse;
import tn.utm.nainternship.assetservice.model.Asset;
import tn.utm.nainternship.assetservice.service.AssetService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllAssets() {
        List<AssetResponse> assets = assetService.findAll()
                .stream()
                .map(Asset::toResponse)
                .toList();
        return ResponseEntity.ok(assets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getAssetById(@PathVariable UUID id) {
        return ResponseEntity.ok(assetService.findById(id).toResponse());
    }

    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<AssetResponse> getAssetBySymbol(@PathVariable String symbol) {
        Asset asset = assetService.findBySymbol(symbol);
        return ResponseEntity.ok(asset.toResponse());
    }

}
