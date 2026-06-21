<template>
  <div class="map-panel" ref="panelRef">
    <div class="panel-header">
      <div class="header-row">
        <button
          v-if="survival.lastSourceTab"
          class="back-btn"
          @click="goBack"
        >
          ← 返回
        </button>
        <div class="header-title-wrap">
          <h3 class="panel-title">🗺️ 海岛地图</h3>
          <p class="panel-subtitle">点击未探索区域进行探索</p>
        </div>
      </div>
      <div v-if="survival.lastSourceTab" class="source-hint">
        来自{{ getSourceLabel(survival.lastSourceTab) }}
      </div>
    </div>

    <div class="map-container">
      <div class="map-grid" ref="mapGridRef">
        <div
          v-for="cell in survival.mapGrid"
          :key="cell.id"
          ref="cellRefs"
          class="map-cell"
          :class="[
            cell.type,
            {
              explored: cell.explored,
              selected: survival.selectedCellId === cell.id,
              highlight: survival.highlightCellId === cell.id
            }
          ]"
          @click="selectCell(cell)"
        >
          <span class="cell-icon">{{ cell.icon }}</span>
          <span v-if="!cell.explored" class="cell-overlay">?</span>
          <div v-if="survival.highlightCellId === cell.id" class="highlight-ring"></div>
        </div>
      </div>

      <div class="map-legend">
        <div class="legend-item">
          <span class="legend-icon">🌳</span>
          <span>森林</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon">🏔️</span>
          <span>山地</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon">🌊</span>
          <span>海洋</span>
        </div>
        <div class="legend-item">
          <span class="legend-icon">🏠</span>
          <span>营地</span>
        </div>
      </div>
    </div>

    <transition name="slide-up">
      <div v-if="survival.selectedCell" class="cell-detail" ref="detailRef">
        <div class="detail-header">
          <span class="detail-icon">{{ survival.selectedCell.icon }}</span>
          <div class="detail-info">
            <h4 class="detail-name">{{ survival.selectedCell.name }}</h4>
            <el-tag size="small" :type="survival.selectedCell.explored ? 'success' : 'warning'">
              {{ survival.selectedCell.explored ? '已探索' : '未探索' }}
            </el-tag>
          </div>
          <button class="close-btn" @click="closeDetail">✕</button>
        </div>

        <div class="detail-type-info">
          <span class="type-label">地形类型</span>
          <span class="type-value">{{ getTypeLabel(survival.selectedCell.type) }}</span>
        </div>

        <div v-if="!survival.selectedCell.explored" class="explore-section">
          <p class="explore-desc">探索此区域可能发现资源，也可能遭遇危险。消耗约5秒时间。</p>
          <button
            class="explore-btn"
            :disabled="isExploring"
            @click="handleExplore"
          >
            <span v-if="isExploring">🔍 探索中...</span>
            <span v-else>🚀 开始探索</span>
          </button>
        </div>

        <div v-else class="explored-section">
          <p class="explored-desc">✅ 该区域已探索完毕，暂未发现新内容。</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useSurvivalStore } from '../../store';

const emit = defineEmits(['switch-tab']);

const survival = useSurvivalStore();
const isExploring = ref(false);
const panelRef = ref(null);
const mapGridRef = ref(null);
const detailRef = ref(null);

const getTypeLabel = (type) => {
  const map = {
    forest: '森林 - 可能有食物和木材',
    mountain: '山地 - 可能有石材资源',
    ocean: '海洋 - 可能有淡水资源',
    camp: '营地 - 你的安全基地'
  };
  return map[type] || type;
};

const getSourceLabel = (tab) => {
  const labels = {
    logs: '日志',
    actions: '行动',
    resources: '资源'
  };
  return labels[tab] || tab;
};

const selectCell = (cell) => {
  survival.setSelectedCell(cell.id);
  survival.flashHighlightCell(cell.id);
  nextTick(() => {
    if (detailRef.value) {
      detailRef.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
};

const closeDetail = () => {
  survival.clearSelectedCell();
  survival.setLastSourceTab(null);
};

const goBack = () => {
  const source = survival.lastSourceTab;
  survival.setLastSourceTab(null);
  if (source) {
    emit('switch-tab', source);
  }
};

const handleExplore = async () => {
  if (!survival.selectedCell || isExploring.value) return;

  isExploring.value = true;
  const cellId = survival.selectedCell.id;
  const result = await survival.exploreCell(cellId);

  isExploring.value = false;

  if (result.ok) {
    survival.flashHighlightCell(cellId);
    if (result.result.type === 'success') {
      const resourceName = survival.resourceConfig[result.result.resource].name;
      ElMessage.success(`🎉 探索成功！获得 +${result.result.amount} ${resourceName}`);
    } else {
      ElMessage.warning('⚠️ 探索遇到危险，损失了一些资源');
    }
    survival.setLastSourceTab('map');
    emit('switch-tab', 'logs');
  } else if (result.alreadyExplored) {
    ElMessage.info('该区域已探索过了');
  }
};

watch(
  () => survival.selectedCellId,
  async (newId) => {
    if (newId !== null) {
      survival.flashHighlightCell(newId);
      await nextTick();
      if (detailRef.value) {
        setTimeout(() => {
          detailRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  },
  { immediate: true }
);

defineExpose({
  selectCell
});
</script>

<style scoped>
.map-panel {
  padding: 16px;
  padding-bottom: 80px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  margin-bottom: 20px;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  padding: 6px 12px;
  border: 1px solid rgba(100, 255, 218, 0.3);
  background: rgba(100, 255, 218, 0.1);
  color: #64ffda;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(100, 255, 218, 0.2);
}

.header-title-wrap {
  flex: 1;
  min-width: 0;
}

.source-hint {
  margin-top: 6px;
  font-size: 11px;
  color: #8892b0;
  padding-left: 0;
}

.panel-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #ccd6f6;
  font-weight: 700;
}

.panel-subtitle {
  margin: 0;
  font-size: 13px;
  color: #8892b0;
}

.map-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 340px;
}

.map-cell {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: visible;
}

.map-cell:hover {
  transform: translateY(-2px);
  border-color: rgba(100, 255, 218, 0.5);
}

.map-cell.selected {
  border-color: #64ffda;
  box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.2);
}

.map-cell.highlight {
  animation: highlightPulse 0.6s ease-in-out 3;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(100, 255, 218, 0.5);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(100, 255, 218, 0);
    transform: scale(1.08);
  }
}

.highlight-ring {
  position: absolute;
  inset: -4px;
  border: 2px solid #64ffda;
  border-radius: 14px;
  animation: ringExpand 1s ease-out infinite;
  pointer-events: none;
}

@keyframes ringExpand {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

.map-cell.explored {
  background: rgba(100, 255, 218, 0.08);
  border-color: rgba(100, 255, 218, 0.3);
}

.map-cell.forest.explored {
  background: rgba(76, 175, 80, 0.15);
  border-color: rgba(76, 175, 80, 0.4);
}

.map-cell.mountain.explored {
  background: rgba(158, 158, 158, 0.15);
  border-color: rgba(158, 158, 158, 0.4);
}

.map-cell.ocean.explored {
  background: rgba(33, 150, 243, 0.15);
  border-color: rgba(33, 150, 243, 0.4);
}

.map-cell.camp {
  background: rgba(255, 193, 7, 0.15);
  border-color: rgba(255, 193, 7, 0.5);
}

.cell-icon {
  font-size: 36px;
  z-index: 1;
}

.cell-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.85);
  color: #64ffda;
  font-size: 28px;
  font-weight: 700;
  z-index: 2;
  border-radius: 10px;
}

.map-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8892b0;
}

.legend-icon {
  font-size: 18px;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.cell-detail {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(100, 255, 218, 0.3);
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(100, 255, 218, 0.1);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.detail-icon {
  font-size: 40px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  flex-shrink: 0;
}

.detail-info {
  flex: 1;
}

.detail-name {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #ccd6f6;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: #8892b0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.detail-type-info {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 14px;
}

.type-label {
  font-size: 13px;
  color: #8892b0;
}

.type-value {
  font-size: 13px;
  color: #ccd6f6;
  font-weight: 500;
}

.explore-section,
.explored-section {
  padding-top: 4px;
}

.explore-desc,
.explored-desc {
  margin: 0 0 14px 0;
  font-size: 13px;
  color: #a8b2d1;
  line-height: 1.5;
}

.explore-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #64ffda 0%, #667eea 100%);
  color: #0a192f;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.explore-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(100, 255, 218, 0.3);
}

.explore-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (min-width: 769px) {
  .map-panel {
    padding-bottom: 16px;
  }
}
</style>
