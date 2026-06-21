<template>
  <div class="resources-panel">
    <div class="panel-header">
      <h3 class="panel-title">📦 关键资源</h3>
      <div class="explore-progress">
        <span>探索进度</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: survival.explorationProgress + '%' }"></div>
        </div>
        <span class="progress-text">{{ survival.exploredCount }}/{{ survival.totalCells }}</span>
      </div>
    </div>

    <div class="resource-grid">
      <div
        v-for="(config, key) in survival.resourceConfig"
        :key="key"
        class="resource-card"
        :class="{ 'has-change': survival.resourceChanges[key] !== 0 }"
      >
        <div class="resource-icon" :style="{ background: config.color + '20', color: config.color }">
          {{ config.icon }}
        </div>
        <div class="resource-info">
          <div class="resource-name">{{ config.name }}</div>
          <div class="resource-value">
            <span class="value-number">{{ survival.resources[key] }}</span>
            <span
              v-if="survival.resourceChanges[key] !== 0"
              class="value-change"
              :class="survival.resourceChanges[key] > 0 ? 'positive' : 'negative'"
            >
              {{ survival.resourceChanges[key] > 0 ? '+' : '' }}{{ survival.resourceChanges[key] }}
            </span>
          </div>
          <div class="resource-bar">
            <div
              class="resource-bar-fill"
              :style="{
                width: Math.min(100, (survival.resources[key] / 200) * 100) + '%',
                background: config.color
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="survival.activeActions.length > 0" class="active-actions-section">
      <h4 class="section-title">⚡ 进行中的行动</h4>
      <div class="active-actions-list">
        <div
          v-for="action in survival.activeActions"
          :key="action.instanceId"
          class="active-action-item"
        >
          <div class="action-icon-small">{{ action.icon }}</div>
          <div class="action-progress-info">
            <div class="action-name">{{ action.name }}</div>
            <div class="action-progress-bar">
              <div
                class="action-progress-fill"
                :style="{ width: getActionProgress(action) + '%' }"
              ></div>
            </div>
          </div>
          <div class="action-time-left">{{ getTimeLeft(action) }}</div>
        </div>
      </div>
    </div>

    <div class="quick-tips">
      <h4 class="section-title">💡 生存提示</h4>
      <div class="tips-list">
        <div class="tip-item">
          <span class="tip-icon">⏰</span>
          <span>每分钟消耗 -5 食物、-5 淡水</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🎯</span>
          <span>探索地图可能获得资源或遭遇危险</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">🏠</span>
          <span>建造庇护所可提升生存安全性</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useSurvivalStore } from '../../store';

const survival = useSurvivalStore();
const now = ref(Date.now());
let timer = null;

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const getActionProgress = (action) => {
  const elapsed = now.value - action.startTime;
  return Math.min(100, (elapsed / action.duration) * 100);
};

const getTimeLeft = (action) => {
  const left = Math.max(0, action.duration - (now.value - action.startTime));
  const seconds = Math.floor(left / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
};
</script>

<style scoped>
.resources-panel {
  padding: 16px;
  padding-bottom: 80px;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #ccd6f6;
  font-weight: 700;
}

.explore-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #8892b0;
  background: rgba(100, 255, 218, 0.08);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #64ffda, #667eea);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-weight: 600;
  color: #64ffda;
  min-width: 40px;
  text-align: right;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.resource-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.resource-card.has-change {
  animation: pulse 0.5s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.resource-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-name {
  font-size: 13px;
  color: #8892b0;
  margin-bottom: 4px;
}

.resource-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.value-number {
  font-size: 22px;
  font-weight: 700;
  color: #ccd6f6;
}

.value-change {
  font-size: 12px;
  font-weight: 600;
  animation: fadeInUp 0.3s ease;
}

.value-change.positive { color: #64ffda; }
.value-change.negative { color: #ff6b6b; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.resource-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.resource-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #ccd6f6;
  font-weight: 600;
}

.active-actions-section {
  margin-bottom: 24px;
}

.active-actions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.active-action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(100, 255, 218, 0.2);
  border-radius: 10px;
  padding: 12px;
}

.action-icon-small {
  font-size: 24px;
  flex-shrink: 0;
}

.action-progress-info {
  flex: 1;
  min-width: 0;
}

.action-name {
  font-size: 13px;
  color: #ccd6f6;
  font-weight: 500;
  margin-bottom: 6px;
}

.action-progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.action-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #64ffda, #667eea);
  border-radius: 2px;
  transition: width 1s linear;
}

.action-time-left {
  font-size: 12px;
  color: #64ffda;
  font-weight: 600;
  flex-shrink: 0;
  min-width: 50px;
  text-align: right;
}

.quick-tips {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #a8b2d1;
}

.tip-icon {
  font-size: 16px;
}

@media (min-width: 769px) {
  .resources-panel {
    padding-bottom: 16px;
  }
}
</style>
