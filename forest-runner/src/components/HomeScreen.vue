<script setup lang="ts">
defineEmits<{
  (e: 'start'): void
  (e: 'showAchievements'): void
  (e: 'showCamp'): void
  (e: 'showMap'): void
  (e: 'showBattlePass'): void
  (e: 'showShop'): void
  (e: 'showCosmetic'): void
}>()

defineProps<{
  highScore: number
  hasUnclaimed?: boolean
}>()
</script>

<template>
  <div class="home-screen">
    <div class="home-content">
      <div class="battle-pass-entry" @click="$emit('showBattlePass')">
        <div class="bp-entry-icon">🎫</div>
        <div class="bp-entry-info">
          <div class="bp-entry-title">森林奇遇赛季</div>
          <div class="bp-entry-subtitle">完成任务赢取皮肤奖励</div>
        </div>
        <div class="bp-entry-arrow">
          <span v-if="hasUnclaimed" class="bp-entry-badge">!</span>
          <span class="arrow-icon">›</span>
        </div>
      </div>

      <div class="title-section">
        <h1 class="game-title">
          <span class="title-icon">🌲</span>
          森林跑酷
          <span class="title-icon">🦊</span>
        </h1>
        <p class="game-subtitle">童话奇幻冒险之旅</p>
      </div>

      <div class="character-preview">
        <div class="character-bounce">
          <div class="character-body"></div>
          <div class="character-head"></div>
          <div class="character-hat"></div>
        </div>
      </div>

      <div class="high-score" v-if="highScore > 0">
        <span class="trophy">🏆</span>
        <span>最高分: {{ highScore }}</span>
      </div>

      <div class="buttons">
        <button class="btn btn-start" @click="$emit('start')">
          <span class="btn-icon">▶</span>
          开始游戏
        </button>
        <button class="btn btn-map" @click="$emit('showMap')">
          <span class="btn-icon">🗺️</span>
          章节冒险
        </button>
        <button class="btn btn-camp" @click="$emit('showCamp')">
          <span class="btn-icon">🏕️</span>
          森林营地
        </button>
        <button class="btn btn-achievements" @click="$emit('showAchievements')">
          <span class="btn-icon">🏅</span>
          成就
        </button>
        <button class="btn btn-shop" @click="$emit('showShop')">
          <span class="btn-icon">🏪</span>
          商店
        </button>
        <button class="btn btn-cosmetic" @click="$emit('showCosmetic')">
          <span class="btn-icon">🎨</span>
          角色装扮
        </button>
      </div>

      <div class="instructions">
        <div class="instruction-item">
          <span class="key">空格</span>
          <span class="key">↑</span>
          <span class="text">点击/跳跃</span>
        </div>
        <div class="instruction-item">
          <span class="key-double">双跳</span>
          <span class="text">空中再按一次</span>
        </div>
      </div>

      <div class="collectibles-preview">
        <div class="collectible-item">
          <span class="collectible-icon coin">💰</span>
          <span>金币 +1</span>
        </div>
        <div class="collectible-item">
          <span class="collectible-icon star">⭐</span>
          <span>星星 +10</span>
        </div>
        <div class="collectible-item">
          <span class="collectible-icon potion">🧪</span>
          <span>无敌药水</span>
        </div>
      </div>
    </div>

    <div class="decorations">
      <div class="cloud cloud-1">☁️</div>
      <div class="cloud cloud-2">☁️</div>
      <div class="cloud cloud-3">☁️</div>
      <div class="tree tree-left">🌳</div>
      <div class="tree tree-right">🌲</div>
      <div class="mushroom mus-1">🍄</div>
      <div class="mushroom mus-2">🍄</div>
    </div>
  </div>
</template>

<style scoped>
.home-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 50%, #90EE90 85%, #3CB371 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 20px;
  max-height: 100%;
  overflow-y: auto;
}

.battle-pass-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 18px;
  margin-bottom: 16px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(102,126,234,0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.battle-pass-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.6s;
}

.battle-pass-entry:hover::before {
  left: 100%;
}

.battle-pass-entry:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(102,126,234,0.5);
}

.battle-pass-entry:active {
  transform: translateY(-1px);
}

.bp-entry-icon {
  font-size: 34px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  animation: ticketBounce 2s ease-in-out infinite;
}

@keyframes ticketBounce {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.bp-entry-info {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.bp-entry-title {
  font-size: 17px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-bottom: 2px;
}

.bp-entry-subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.85);
  font-weight: 500;
}

.bp-entry-arrow {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.bp-entry-badge {
  width: 22px;
  height: 22px;
  background: #FF4444;
  border-radius: 50%;
  color: white;
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255,68,68,0.5);
  animation: badgePulse 1.2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(255,68,68,0.5); }
  50% { transform: scale(1.15); box-shadow: 0 4px 14px rgba(255,68,68,0.7); }
}

.arrow-icon {
  font-size: 26px;
  font-weight: 700;
  color: white;
  opacity: 0.9;
  transition: transform 0.2s;
}

.battle-pass-entry:hover .arrow-icon {
  transform: translateX(4px);
}

.title-section {
  margin-bottom: 20px;
}

.game-title {
  font-size: 48px;
  font-weight: 900;
  color: #2d5a27;
  text-shadow: 3px 3px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-icon {
  font-size: 40px;
  animation: bounce 2s ease-in-out infinite;
}

.title-icon:last-child {
  animation-delay: 0.5s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.game-subtitle {
  font-size: 20px;
  color: #4a7c59;
  margin-top: 8px;
  font-weight: 500;
}

.character-preview {
  height: 120px;
  margin: 30px 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.character-bounce {
  position: relative;
  width: 50px;
  height: 70px;
  animation: characterBounce 1s ease-in-out infinite;
}

@keyframes characterBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.character-body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 45px;
  background: #FF6B6B;
  border-radius: 20px 20px 15px 15px;
}

.character-head {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 35px;
  height: 35px;
  background: #FFE4C4;
  border-radius: 50%;
}

.character-hat {
  position: absolute;
  bottom: 65px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 20px;
  background: #FFE66D;
  border-radius: 20px 20px 0 0;
}

.high-score {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 215, 0, 0.3);
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  color: #b8860b;
  margin-bottom: 25px;
  border: 2px solid #FFD700;
}

.trophy {
  font-size: 24px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  margin-bottom: 30px;
}

.btn {
  padding: 16px 50px;
  font-size: 22px;
  font-weight: bold;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
  justify-content: center;
}

.btn:hover {
  transform: scale(1.05);
}

.btn:active {
  transform: scale(0.98);
}

.btn-start {
  background: linear-gradient(180deg, #4CAF50 0%, #388E3C 100%);
  color: white;
  box-shadow: 0 6px 0 #2E7D32, 0 8px 15px rgba(0,0,0,0.2);
}

.btn-start:hover {
  box-shadow: 0 8px 0 #2E7D32, 0 10px 20px rgba(0,0,0,0.25);
}

.btn-start:active {
  box-shadow: 0 2px 0 #2E7D32, 0 4px 10px rgba(0,0,0,0.2);
  transform: translateY(4px) scale(0.98);
}

.btn-camp {
  background: linear-gradient(180deg, #FF8C00 0%, #D2691E 100%);
  color: white;
  box-shadow: 0 6px 0 #8B4513, 0 8px 15px rgba(0,0,0,0.2);
}

.btn-camp:hover {
  box-shadow: 0 8px 0 #8B4513, 0 10px 20px rgba(0,0,0,0.25);
}

.btn-camp:active {
  box-shadow: 0 2px 0 #8B4513, 0 4px 10px rgba(0,0,0,0.2);
  transform: translateY(4px) scale(0.97);
}

.btn-map {
  background: linear-gradient(180deg, #6A5ACD 0%, #483D8B 100%);
  color: white;
  box-shadow: 0 6px 0 #4B0082, 0 8px 15px rgba(0,0,0,0.2);
}

.btn-map:hover {
  box-shadow: 0 8px 0 #4B0082, 0 10px 20px rgba(0,0,0,0.25);
}

.btn-map:active {
  box-shadow: 0 2px 0 #4B0082, 0 4px 10px rgba(0,0,0,0.2);
  transform: translateY(4px) scale(0.97);
}

.btn-achievements {
  background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
  color: #8B4513;
  box-shadow: 0 6px 0 #CD853F, 0 8px 15px rgba(0,0,0,0.2);
}

.btn-achievements:hover {
  box-shadow: 0 8px 0 #CD853F, 0 10px 20px rgba(0,0,0,0.25);
}

.btn-achievements:active {
  box-shadow: 0 2px 0 #CD853F, 0 4px 10px rgba(0,0,0,0.2);
  transform: translateY(4px) scale(0.98);
}

.btn-shop {
  background: linear-gradient(180deg, #E91E63 0%, #C2185B 100%);
  color: white;
  box-shadow: 0 6px 0 #880E4F, 0 8px 15px rgba(0,0,0,0.2);
}

.btn-shop:hover {
  box-shadow: 0 8px 0 #880E4F, 0 10px 20px rgba(0,0,0,0.25);
}

.btn-shop:active {
  box-shadow: 0 2px 0 #880E4F, 0 4px 10px rgba(0,0,0,0.2);
  transform: translateY(4px) scale(0.98);
}

.btn-cosmetic {
  background: linear-gradient(180deg, #9C27B0 0%, #7B1FA2 100%);
  color: white;
  box-shadow: 0 6px 0 #4A148C, 0 8px 15px rgba(0,0,0,0.2);
}

.btn-cosmetic:hover {
  box-shadow: 0 8px 0 #4A148C, 0 10px 20px rgba(0,0,0,0.25);
}

.btn-cosmetic:active {
  box-shadow: 0 2px 0 #4A148C, 0 4px 10px rgba(0,0,0,0.2);
  transform: translateY(4px) scale(0.98);
}

.btn-icon {
  font-size: 18px;
}

.instructions {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2d5a27;
}

.key {
  display: inline-block;
  padding: 4px 10px;
  background: white;
  border: 2px solid #90EE90;
  border-radius: 6px;
  font-weight: bold;
  font-size: 13px;
  box-shadow: 0 2px 0 #3CB371;
}

.key-double {
  display: inline-block;
  padding: 4px 10px;
  background: #9932CC;
  color: white;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
}

.text {
  color: #4a7c59;
}

.collectibles-preview {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.collectible-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #4a7c59;
  font-weight: 500;
}

.collectible-icon {
  font-size: 30px;
  animation: float 2s ease-in-out infinite;
}

.collectible-icon.star {
  animation-delay: 0.3s;
}

.collectible-icon.potion {
  animation-delay: 0.6s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.decorations {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.cloud {
  position: absolute;
  font-size: 60px;
  opacity: 0.9;
}

.cloud-1 {
  top: 10%;
  left: 10%;
  animation: cloudFloat 20s linear infinite;
}

.cloud-2 {
  top: 20%;
  right: 15%;
  font-size: 50px;
  animation: cloudFloat 25s linear infinite reverse;
}

.cloud-3 {
  top: 5%;
  left: 40%;
  font-size: 45px;
  animation: cloudFloat 30s linear infinite;
}

@keyframes cloudFloat {
  0% { transform: translateX(-100px); }
  100% { transform: translateX(100px); }
}

.tree {
  position: absolute;
  bottom: 10%;
  font-size: 80px;
}

.tree-left {
  left: 5%;
  transform: scaleX(-1);
}

.tree-right {
  right: 5%;
}

.mushroom {
  position: absolute;
  bottom: 8%;
  font-size: 40px;
}

.mus-1 {
  left: 20%;
}

.mus-2 {
  right: 25%;
}

@media (max-width: 480px) {
  .game-title {
    font-size: 32px;
  }
  
  .title-icon {
    font-size: 28px;
  }
  
  .game-subtitle {
    font-size: 16px;
  }
  
  .btn {
    padding: 14px 40px;
    font-size: 18px;
    min-width: 160px;
  }
  
  .tree, .mushroom {
    display: none;
  }
  
  .instructions {
    gap: 15px;
  }
}
</style>
