package tn.utm.nainternship.marketservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import tn.utm.nainternship.marketservice.dto.TradeEvent;
import tn.utm.nainternship.marketservice.entity.TradeEntity;

@Mapper(componentModel = "spring")
public interface TradeMapper {
    TradeMapper INSTANCE = Mappers.getMapper(TradeMapper.class);

    TradeEntity toEntity(TradeEvent event);

    TradeEvent toDto(TradeEntity entity);
}

