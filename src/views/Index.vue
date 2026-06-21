<template>
  <div class="command-view">
    <header class="command-header">
      <div class="header-left">
        <h1 class="app-title">🏝️ 海岛生存</h1>
        <span class="app-subtitle">生存指挥中心</span>
      </div>
      <div class="header-right">
        <div class="quick-resources desktop-only">
          <span
            v-for="(config, key) in survival.resourceConfig"
            :key="key"
            class="quick-res-item"
            :title="config.name"
          >
            <span class="qr-icon">{{ config.icon }}</span>
            <span class="qr-value" :style="{ color: config.color }">{{ survival.resources[key] }}</span>
          </span>
        </div>
        <button class="reset-btn" @click="handleReset" title="重新开始">
          🔄
        </button>
      </div>
    </header>

    <div v-if="isMobile" class="mobile-view">
      <transition name="tab-fade" mode="out-in">
        <ResourcesPanel
          v-if="activeTab === 'resources'"
          key="resources"
          @switch-tab="switchTab"
        />
        <MapPanel
          v-else-if="activeTab === 'map'"
          key="map"
          @switch-tab="switchTab"
        />
        <ActionsPanel
          v-else-if="activeTab === 'actions'"
          key="actions"
          @switch-tab="switchTab"
        />
        <LogsPanel
          v-else-if="activeTab === 'logs'"
          key="logs"
          @switch-tab="switchTab"
        />
      </transition>
      <CommandTabBar v-model="activeTab" />
    </div>

    <div v-else class="desktop-view">
      <div class="desktop-main">
        <div class="desktop-left">
          <div class="panel-wrapper">
            <ResourcesPanel />
          </div>
        </div>

        <div class="desktop-center">
          <div class="panel-wrapper">
            <MapPanel @switch-tab="switchTab" />
          </div>
        </div>

        <div class="desktop-right">
          <div class="panel-wrapper">
            <ActionsPanel @switch-tab="switchTab" />
          </div>
        </div>
      </div>

      <div class="desktop-bottom">
        <div class="panel-wrapper logs-wrapper">
          <LogsPanel @switch-tab="switchTab" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useSurvivalStore } from '../store';
import CommandTabBar from './Survival/CommandTabBar.vue';
import ResourcesPanel from './Survival/ResourcesPanel.vue';
import MapPanel from './Survival/MapPanel.vue';
import ActionsPanel from './Survival/ActionsPanel.vue';
import LogsPanel from './Survival/LogsPanel.vue';

const survival = useSurvivalStore();
const activeTab = ref('resources');
const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const switchTab = (tab) => {
  activeTab.value = tab;
};

const handleReset = () => {
  ElMessageBox.confirm(
    '确定要重新开始游戏吗？所有进度将丢失。',
    '重新开始',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    survival.resetGame();
    activeTab.value = 'resources';
  }).catch(() => {});
};

let resizeTimer = null;
const handleResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(checkMobile, 150);
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', handleResize);
  survival.startResourceConsumption();
  survival.addMessage('欢迎来到海岛生存指挥中心！', 'system');
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeTimer) clearTimeout(resizeTimer);
});
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.command-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a192f 0%, #1a1a2e 50%, #16213e 100%);
  color: #ccd6f6;
  display: flex;
  flex-direction: column;
}

.command-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(10, 25, 47, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(100, 255, 218, 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ccd6f6;
  background: linear-gradient(135deg, #64ffda, #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 12px;
  color: #8892b0;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.quick-resources {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.quick-res-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.qr-icon {
  font-size: 16px;
}

.qr-value {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.reset-btn {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-btn:hover {
  background: rgba(255, 107, 107, 0.15);
  border-color: rgba(255, 107, 107, 0.3);
  transform: rotate(180deg);
}

.mobile-view {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding-bottom: 0;
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all 0.25s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateX(15px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}

.desktop-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
}

.desktop-main {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr 340px;
  gap: 16px;
  min-height: 0;
}

.desktop-left,
.desktop-center,
.desktop-right {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.desktop-bottom {
  height: 260px;
  flex-shrink: 0;
}

.panel-wrapper {
  flex: 1;
  min-height: 0;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logs-wrapper {
  height: 100%;
}

.panel-wrapper :deep(.resources-panel),
.panel-wrapper :deep(.map-panel),
.panel-wrapper :deep(.actions-panel),
.panel-wrapper :deep(.logs-panel) {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.panel-wrapper :deep(.resources-panel) { padding-bottom: 16px; }
.panel-wrapper :deep(.map-panel) { padding-bottom: 16px; }
.panel-wrapper :deep(.actions-panel) { padding-bottom: 16px; }
.panel-wrapper :deep(.logs-panel) { padding-bottom: 16px; height: 100%; }

.panel-wrapper :deep(.action-grid) {
  grid-template-columns: 1fr;
}

@media (max-width: 1200px) {
  .desktop-main {
    grid-template-columns: 280px 1fr 300px;
  }
}

@media (max-width: 992px) {
  .desktop-main {
    grid-template-columns: 1fr 1fr;
  }
  .desktop-right {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .command-header {
    padding: 12px 16px;
  }

  .app-title {
    font-size: 18px;
  }

  .app-subtitle {
    display: none;
  }

  .desktop-only {
    display: none !important;
  }

  .desktop-view {
    display: none;
  }
}

@media (min-width: 769px) {
  .mobile-view {
    display: none;
  }
}
</style>
