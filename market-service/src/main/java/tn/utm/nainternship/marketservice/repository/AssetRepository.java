package tn.utm.nainternship.marketservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.utm.nainternship.marketservice.entity.Asset;

import java.util.Optional;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Optional<Asset> findBySymbol(String symbol);

    Optional<Asset> findBySymbolIgnoreCase(String symbol);
}
