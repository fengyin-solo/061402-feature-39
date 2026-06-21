<template>
  <div class="actions-panel">
    <div class="panel-header">
      <h3 class="panel-title">⚡ 可执行操作</h3>
      <p class="panel-subtitle">选择行动来获取资源或建造设施</p>
    </div>

    <div v-if="survival.activeActions.length > 0" class="active-section">
      <div class="section-header">
        <h4 class="section-title">进行中</h4>
        <span class="active-count">{{ survival.activeActions.length }}</span>
      </div>
      <div class="active-list">
        <div
          v-for="action in survival.activeActions"
          :key="action.instanceId"
          class="active-item"
        >
          <div class="active-icon">{{ action.icon }}</div>
          <div class="active-info">
            <div class="active-name">{{ action.name }}</div>
            <div class="active-progress">
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{ width: getProgress(action) + '%' }"
                ></div>
              </div>
              <span class="time-left">{{ getTimeLeft(action) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-header">
      <h4 class="section-title">采集与收集</h4>
    </div>
    <div class="action-grid">
      <div
        v-for="action in collectActions"
        :key="action.id"
        class="action-card"
        :class="{ disabled: !canAfford(action) }"
        @click="handleAction(action)"
      >
        <div class="action-icon">{{ action.icon }}</div>
        <div class="action-info">
          <div class="action-title">{{ action.name }}</div>
          <div class="action-desc">{{ action.desc }}</div>
          <div class="action-meta">
            <span class="meta-item duration">⏱️ {{ formatDuration(action.duration) }}</span>
            <span
              v-for="(amount, key) in action.gain"
              :key="key"
              class="meta-item gain"
            >
              {{ survival.resourceConfig[key].icon }} +{{ amount }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-header">
      <h4 class="section-title">建造与制作</h4>
    </div>
    <div class="action-grid">
      <div
        v-for="action in craftActions"
        :key="action.id"
        class="action-card"
        :class="{ disabled: !canAfford(action) }"
        @click="handleAction(action)"
      >
        <div class="action-icon">{{ action.icon }}</div>
        <div class="action-info">
          <div class="action-title">{{ action.name }}</div>
          <div class="action-desc">{{ action.desc }}</div>
          <div class="action-meta">
            <span class="meta-item duration">⏱️ {{ formatDuration(action.duration) }}</span>
          </div>
          <div class="action-cost" v-if="Object.keys(action.cost).length > 0">
            <span
              v-for="(amount, key) in action.cost"
              :key="key"
              class="cost-item"
              :class="{ insufficient: survival.resources[key] < amount }"
            >
              {{ survival.resourceConfig[key].icon }} {{ survival.resources[key] }}/{{ amount }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useSurvivalStore } from '../../store';

const emit = defineEmits(['switch-tab']);

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

const collectActions = computed(() => survival.actions.filter(a => !a.cost || Object.keys(a.cost).length === 0));
const craftActions = computed(() => survival.actions.filter(a => a.cost && Object.keys(a.cost).length > 0));

const canAfford = (action) => {
  if (!action.cost) return true;
  for (const [resource, amount] of Object.entries(action.cost)) {
    if (survival.resources[resource] < amount) return false;
  }
  return true;
};

const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}秒`;
  if (secs === 0) return `${mins}分钟`;
  return `${mins}分${secs}秒`;
};

const getProgress = (action) => {
  const elapsed = now.value - action.startTime;
  return Math.min(100, (elapsed / action.duration) * 100);
};

const getTimeLeft = (action) => {
  const left = Math.max(0, action.duration - (now.value - action.startTime));
  const seconds = Math.floor(left / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
};

const handleAction = (action) => {
  if (!canAfford(action)) {
    ElMessage.error('❌ 资源不足，无法执行此操作');
    return;
  }
  const result = survival.performAction(action.id);
  if (result.ok) {
    ElMessage.success(`✅ 开始${action.name}`);
    emit('switch-tab', 'resources');
  } else if (result.error) {
    ElMessage.error(result.error);
  }
};
</script>

<style scoped>
.actions-panel {
  padding: 16px;
  padding-bottom: 80px;
}

.panel-header {
  margin-bottom: 20px;
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

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  color: #ccd6f6;
  font-weight: 600;
}

.active-count {
  background: rgba(100, 255, 218, 0.2);
  color: #64ffda;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.active-section {
  margin-bottom: 8px;
}

.active-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.active-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(100, 255, 218, 0.08);
  border: 1px solid rgba(100, 255, 218, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
}

.active-icon {
  font-size: 28px;
  flex-shrink: 0;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.active-info {
  flex: 1;
  min-width: 0;
}

.active-name {
  font-size: 14px;
  color: #ccd6f6;
  font-weight: 600;
  margin-bottom: 6px;
}

.active-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #64ffda, #667eea);
  border-radius: 3px;
  transition: width 1s linear;
}

.time-left {
  font-size: 12px;
  color: #64ffda;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: right;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.action-card:hover:not(.disabled) {
  transform: translateY(-2px);
  border-color: rgba(100, 255, 218, 0.4);
  background: rgba(100, 255, 218, 0.05);
}

.action-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 15px;
  color: #ccd6f6;
  font-weight: 600;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #8892b0;
  margin-bottom: 8px;
  line-height: 1.4;
}

.action-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.meta-item {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.meta-item.duration {
  background: rgba(136, 146, 176, 0.15);
  color: #a8b2d1;
}

.meta-item.gain {
  background: rgba(100, 255, 218, 0.15);
  color: #64ffda;
}

.action-cost {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cost-item {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
  background: rgba(136, 146, 176, 0.15);
  color: #a8b2d1;
}

.cost-item.insufficient {
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
}

@media (min-width: 769px) {
  .actions-panel {
    padding-bottom: 16px;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
