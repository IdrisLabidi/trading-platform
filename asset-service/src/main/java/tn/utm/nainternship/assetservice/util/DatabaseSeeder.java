package tn.utm.nainternship.assetservice.util;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import tn.utm.nainternship.assetservice.Repository.AssetRepository;
import tn.utm.nainternship.assetservice.model.Asset;
import tn.utm.nainternship.assetservice.model.AssetType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final AssetRepository assetRepository;

    private final List<Asset> initialAssets = List.of(
            Asset.builder()
                    .symbol("BIAT")
                    .description("Banque Internationale Arabe de Tunisie")
                    .name("Banque Internationale Arabe de Tunisie")
                    .type(AssetType.STOCK)
                    .market("TUNIS")
                    .currency("TND")
                    .lastPrice(new BigDecimal("145.00"))
                    .isActive(true)
                    .listedAt(Instant.now())
                    .build(),
            Asset.builder()
                    .symbol("ATB")
                    .description("Arab Tunisian Bank")
                    .name("Arab Tunisian Bank")
                    .type(AssetType.STOCK)
                    .market("TUNIS")
                    .currency("TND")
                    .lastPrice(new BigDecimal("22.50"))
                    .isActive(true)
                    .listedAt(Instant.now())
                    .build(),
            Asset.builder()
                    .symbol("SFBT")
                    .description("Société de Fabrication des Boissons")
                    .name("Société de Fabrication des Boissons")
                    .type(AssetType.STOCK)
                    .market("TUNIS")
                    .currency("TND")
                    .lastPrice(new BigDecimal("18.30"))
                    .isActive(true)
                    .listedAt(Instant.now())
                    .build(),
            Asset.builder()
                    .symbol("TUN-ETF")
                    .description("ETF Tunindex 20")
                    .name("ETF Tunindex 20")
                    .type(AssetType.ETF)
                    .market("TUNIS")
                    .currency("TND")
                    .lastPrice(new BigDecimal("98.00"))
                    .isActive(true)
                    .listedAt(Instant.now())
                    .build(),
            Asset.builder()
                    .symbol("SP500")
                    .description("S&P 500 ETF")
                    .name("S&P 500 ETF")
                    .type(AssetType.ETF)
                    .market("NYSE")
                    .currency("USD")
                    .lastPrice(new BigDecimal("520.00"))
                    .isActive(true)
                    .listedAt(Instant.now())
                    .build()
    );

    @Override
    public void run(String... args) throws Exception {
        if (assetRepository.count() == 0) {
            // Seed the database with initial data
            assetRepository.saveAll(initialAssets);
        }
    }

}
