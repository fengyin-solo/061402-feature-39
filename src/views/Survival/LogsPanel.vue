<template>
  <div class="logs-panel">
    <div class="panel-header">
      <h3 class="panel-title">📜 生存日志</h3>
      <p class="panel-subtitle">记录你的每一次行动和发现</p>
    </div>

    <div class="log-filter">
      <button
        v-for="filter in filters"
        :key="filter.key"
        class="filter-btn"
        :class="{ active: activeFilter === filter.key }"
        @click="activeFilter = filter.key"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="log-list" ref="logListRef">
      <transition-group name="log-item">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="log-card"
          :class="log.type"
          @click="handleLogClick(log)"
        >
          <div class="log-type-icon">{{ getTypeIcon(log.type) }}</div>
          <div class="log-content">
            <div class="log-text">{{ log.content }}</div>
            <div class="log-meta">
              <span class="log-time">{{ log.time }}</span>
              <span v-if="log.linkedCell !== null" class="log-link tag-map">
                🗺️ 关联地图
              </span>
              <span v-if="log.linkedAction !== null" class="log-link tag-action">
                ⚡ 关联行动
              </span>
            </div>
          </div>
          <div v-if="log.linkedCell !== null || log.linkedAction !== null" class="log-arrow">
            →
          </div>
        </div>
      </transition-group>

      <div v-if="filteredLogs.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无日志记录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useSurvivalStore } from '../../store';

const emit = defineEmits(['switch-tab', 'select-cell']);

const survival = useSurvivalStore();
const activeFilter = ref('all');
const logListRef = ref(null);

const filters = [
  { key: 'all', label: '全部' },
  { key: 'action', label: '行动' },
  { key: 'success', label: '成功' },
  { key: 'warning', label: '警告' },
  { key: 'system', label: '系统' }
];

const filteredLogs = computed(() => {
  const logs = [...survival.messageLog].reverse();
  if (activeFilter.value === 'all') return logs;
  return logs.filter(log => log.type === activeFilter.value);
});

const getTypeIcon = (type) => {
  const icons = {
    system: '🔔',
    info: 'ℹ️',
    action: '⚡',
    success: '✅',
    warning: '⚠️',
    danger: '🚨'
  };
  return icons[type] || '📝';
};

const handleLogClick = (log) => {
  if (log.linkedCell !== null) {
    survival.setLastSourceTab('logs');
    survival.setSelectedCell(log.linkedCell);
    emit('switch-tab', 'map');
  } else if (log.linkedAction !== null) {
    survival.setLastSourceTab('logs');
    emit('switch-tab', 'actions');
  }
};

watch(
  () => survival.messageLog.length,
  async () => {
    await nextTick();
    if (logListRef.value) {
      logListRef.value.scrollTop = 0;
    }
  }
);
</script>

<style scoped>
.logs-panel {
  padding: 16px;
  padding-bottom: 80px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  margin-bottom: 16px;
  flex-shrink: 0;
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

.log-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
  flex-shrink: 0;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #8892b0;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: rgba(100, 255, 218, 0.3);
  color: #a8b2d1;
}

.filter-btn.active {
  background: rgba(100, 255, 218, 0.15);
  border-color: rgba(100, 255, 218, 0.4);
  color: #64ffda;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item-enter-active {
  transition: all 0.3s ease;
}

.log-item-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.log-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: default;
  transition: all 0.2s ease;
}

.log-card.action {
  border-left: 3px solid #667eea;
  background: rgba(102, 126, 234, 0.06);
}

.log-card.success {
  border-left: 3px solid #64ffda;
  background: rgba(100, 255, 218, 0.06);
}

.log-card.warning {
  border-left: 3px solid #f5a623;
  background: rgba(245, 166, 35, 0.06);
}

.log-card.danger {
  border-left: 3px solid #ff6b6b;
  background: rgba(255, 107, 107, 0.06);
}

.log-card.system {
  border-left: 3px solid #8892b0;
}

.log-card.action:hover,
.log-card.success:hover {
  cursor: pointer;
  transform: translateX(2px);
  border-color: rgba(100, 255, 218, 0.3);
}

.log-type-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-text {
  font-size: 13px;
  color: #ccd6f6;
  line-height: 1.5;
  margin-bottom: 6px;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.log-time {
  font-size: 11px;
  color: #667085;
  font-variant-numeric: tabular-nums;
}

.log-link {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.log-link.tag-map {
  background: rgba(102, 126, 234, 0.15);
  color: #a5b4fc;
}

.log-link.tag-action {
  background: rgba(100, 255, 218, 0.15);
  color: #64ffda;
}

.log-arrow {
  color: #667085;
  font-size: 14px;
  flex-shrink: 0;
  align-self: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  margin: 0;
  font-size: 14px;
  color: #667085;
}

@media (min-width: 769px) {
  .logs-panel {
    padding-bottom: 16px;
  }
}
</style>
