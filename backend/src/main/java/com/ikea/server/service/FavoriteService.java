package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.entity.Favorite;
import com.ikea.server.mapper.FavoriteMapper;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 用户收藏业务：负责 favorite 表的读写与后台统计。 */
@Service
public class FavoriteService {

  public record FavoriteEntry(Long userId, List<String> productIds) {}

  private final FavoriteMapper favoriteMapper;

  public FavoriteService(FavoriteMapper favoriteMapper) {
    this.favoriteMapper = favoriteMapper;
  }

  public List<String> listProductIds(Long userId) {
    if (userId == null) {
      return List.of();
    }
    return favoriteMapper.selectList(
            Wrappers.lambdaQuery(Favorite.class)
                .eq(Favorite::getUserId, userId)
                .orderByDesc(Favorite::getCreatedAt))
        .stream()
        .map(Favorite::getProductId)
        .toList();
  }

  @Transactional
  public void add(Long userId, String productId) {
    if (userId == null || productId == null || productId.isBlank()) {
      throw new IllegalArgumentException("收藏参数不正确");
    }
    Long count =
        favoriteMapper.selectCount(
            Wrappers.lambdaQuery(Favorite.class)
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getProductId, productId));
    if (count != null && count > 0) {
      return;
    }
    Favorite favorite = new Favorite();
    favorite.setUserId(userId);
    favorite.setProductId(productId);
    favoriteMapper.insert(favorite);
  }

  @Transactional
  public void remove(Long userId, String productId) {
    if (userId == null || productId == null || productId.isBlank()) {
      return;
    }
    favoriteMapper.delete(
        Wrappers.lambdaQuery(Favorite.class)
            .eq(Favorite::getUserId, userId)
            .eq(Favorite::getProductId, productId));
  }

  @Transactional
  public void clearAllForUser(Long userId) {
    if (userId == null) {
      return;
    }
    favoriteMapper.delete(
        Wrappers.lambdaQuery(Favorite.class).eq(Favorite::getUserId, userId));
  }

  /** All non-empty favorite lists, newest first. */
  public List<FavoriteEntry> allFavorites() {
    List<Favorite> favorites =
        favoriteMapper.selectList(
            Wrappers.lambdaQuery(Favorite.class).orderByDesc(Favorite::getCreatedAt));
    Map<Long, LinkedHashMap<String, Boolean>> grouped = new LinkedHashMap<>();
    for (Favorite favorite : favorites) {
      grouped
          .computeIfAbsent(favorite.getUserId(), ignored -> new LinkedHashMap<>())
          .putIfAbsent(favorite.getProductId(), Boolean.TRUE);
    }
    return grouped.entrySet().stream()
        .map(entry -> new FavoriteEntry(entry.getKey(), List.copyOf(entry.getValue().keySet())))
        .toList();
  }

  public long countUsersWithFavorites() {
    return allFavorites().size();
  }
}
