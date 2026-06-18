package tn.utm.nainternship.marketservice.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import tn.utm.nainternship.marketservice.dto.OrderRequest;
import tn.utm.nainternship.marketservice.entity.OrderEntity;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    OrderMapper INSTANCE = Mappers.getMapper(OrderMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "remainingQty", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    OrderEntity toEntity(OrderRequest request);
}

