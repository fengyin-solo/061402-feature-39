<template>
  <div class="command-tabbar">
    <div
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-item"
      :class="{ active: modelValue === tab.key }"
      @click="$emit('update:modelValue', tab.key)"
    >
      <div class="tab-icon">
        <span class="icon-text">{{ tab.icon }}</span>
        <span v-if="tab.badge && tab.badge() > 0" class="tab-badge">{{ tab.badge() }}</span>
      </div>
      <div class="tab-label">{{ tab.label }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSurvivalStore } from '../../store';

const props = defineProps({
  modelValue: {
    type: String,
    default: 'resources'
  }
});

defineEmits(['update:modelValue']);

const survival = useSurvivalStore();

const tabs = computed(() => [
  { key: 'resources', label: '资源', icon: '📦', badge: () => 0 },
  { key: 'map', label: '地图', icon: '🗺️', badge: () => {
      const unexplored = survival.mapGrid.filter(c => !c.explored).length;
      return unexplored > 0 ? unexplored : 0;
    }
  },
  { key: 'actions', label: '行动', icon: '⚡', badge: () => survival.activeActions.length },
  { key: 'logs', label: '日志', icon: '📜', badge: () => 0 }
]);
</script>

<style scoped>
.command-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #8892b0;
}

.tab-item.active {
  color: #64ffda;
}

.tab-item.active .tab-icon {
  transform: translateY(-2px);
}

.tab-icon {
  position: relative;
  font-size: 22px;
  margin-bottom: 2px;
  transition: transform 0.2s ease;
}

.icon-text {
  font-size: 20px;
}

.tab-badge {
  position: absolute;
  top: -4px;
  right: -10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #ff6b6b;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}

@media (min-width: 769px) {
  .command-tabbar {
    display: none;
  }
}
</style>
