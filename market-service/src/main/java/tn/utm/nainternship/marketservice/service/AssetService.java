package tn.utm.nainternship.marketservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.utm.nainternship.marketservice.entity.Asset;
import tn.utm.nainternship.marketservice.exception.AssetNotFoundException;
import tn.utm.nainternship.marketservice.repository.AssetRepository;

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
