package tn.utm.nainternship.assetservice.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.utm.nainternship.assetservice.model.Asset;

import java.util.Optional;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Optional<Asset> findBySymbol(String symbol);
}
