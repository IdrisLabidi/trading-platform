package tn.utm.nainternship.assetservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.utm.nainternship.assetservice.Repository.AssetRepository;
import tn.utm.nainternship.assetservice.model.Asset;
import tn.utm.nainternship.assetservice.exception.AssetNotFoundException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssetService {
    private final AssetRepository assetRepository;

    public List<Asset> findAll() {
        return assetRepository.findAll();
    }

    public Asset findById(UUID id) {
        return assetRepository.findById(id).orElseThrow(() -> new AssetNotFoundException("Asset not found"));
    }

    public Asset findBySymbol(String symbol) {
        return assetRepository.findBySymbol(symbol)
                .orElseThrow(() -> new AssetNotFoundException("Asset not found"));
    }
}
