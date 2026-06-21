import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export default defineStore('survival', () => {
  const resources = ref({
    food: 100,
    water: 100,
    wood: 100,
    stone: 100
  });

  const resourceChanges = ref({
    food: 0,
    water: 0,
    wood: 0,
    stone: 0
  });

  const messageLog = ref([
    { id: 1, time: '00:00', content: '你来到了一个荒岛，开始你的生存之旅吧！', type: 'system', linkedAction: null, linkedCell: null }
  ]);

  const mapGrid = ref([
    { id: 0, type: 'forest', icon: '🌳', explored: true, name: '西部森林' },
    { id: 1, type: 'forest', icon: '🌳', explored: true, name: '北部森林' },
    { id: 2, type: 'mountain', icon: '🏔️', explored: false, name: '神秘山脉' },
    { id: 3, type: 'ocean', icon: '🌊', explored: false, name: '东侧海岸' },
    { id: 4, type: 'camp', icon: '🏠', explored: true, name: '主营地' },
    { id: 5, type: 'forest', icon: '🌳', explored: false, name: '南部森林' },
    { id: 6, type: 'ocean', icon: '🌊', explored: false, name: '西南海滩' },
    { id: 7, type: 'mountain', icon: '🏔️', explored: false, name: '岩石高地' },
    { id: 8, type: 'forest', icon: '🌳', explored: false, name: '幽静密林' }
  ]);

  const activeActions = ref([]);
  let logIdCounter = 2;
  let actionIdCounter = 1;

  const actions = [
    { id: 'gatherFood', name: '采集食物', icon: '🍓', desc: '在岛上寻找可食用的果实和动物', duration: 30000, cost: {}, gain: { food: 20 } },
    { id: 'collectWater', name: '收集淡水', icon: '💧', desc: '收集雨水或净化海水', duration: 60000, cost: {}, gain: { water: 30 } },
    { id: 'chopWood', name: '砍伐木材', icon: '🪓', desc: '砍伐树木获取木材资源', duration: 120000, cost: {}, gain: { wood: 15 } },
    { id: 'mineStone', name: '挖掘石头', icon: '⛏️', desc: '在岛上挖掘石头资源', duration: 180000, cost: {}, gain: { stone: 10 } },
    { id: 'buildShelter', name: '建造庇护所', icon: '🏠', desc: '建造一个安全的住所', duration: 300000, cost: { wood: 50, stone: 30 }, gain: {} },
    { id: 'craftTools', name: '制作工具', icon: '🔨', desc: '制作更高效的生存工具', duration: 120000, cost: { wood: 20, stone: 10 }, gain: {} }
  ];

  const resourceConfig = {
    food: { name: '食物', icon: '🍖', color: '#e6a23c' },
    water: { name: '淡水', icon: '💧', color: '#409eff' },
    wood: { name: '木材', icon: '🪵', color: '#90613a' },
    stone: { name: '石头', icon: '⛏️', color: '#909399' }
  };

  const exploredCount = computed(() => mapGrid.value.filter(c => c.explored).length);
  const totalCells = computed(() => mapGrid.value.length);
  const explorationProgress = computed(() => Math.round((exploredCount.value / totalCells.value) * 100));

  const addMessage = (content, type = 'info', linkedAction = null, linkedCell = null) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    messageLog.value.push({
      id: logIdCounter++,
      time,
      content,
      type,
      linkedAction,
      linkedCell
    });
    if (messageLog.value.length > 50) {
      messageLog.value.shift();
    }
  };

  const updateResources = (changes) => {
    for (const [key, value] of Object.entries(changes)) {
      if (resources.value[key] !== undefined) {
        resources.value[key] = Math.max(0, resources.value[key] + value);
        resourceChanges.value[key] = value;
      }
    }
    setTimeout(() => {
      for (const key of Object.keys(resourceChanges.value)) {
        resourceChanges.value[key] = 0;
      }
    }, 2000);
  };

  const checkResources = (cost) => {
    for (const [resource, amount] of Object.entries(cost)) {
      if (resources.value[resource] < amount) {
        return { ok: false, resource, needed: amount, have: resources.value[resource] };
      }
    }
    return { ok: true };
  };

  const performAction = (actionId) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return { ok: false, error: '操作不存在' };

    const check = checkResources(action.cost);
    if (!check.ok) {
      return { ok: false, error: `资源不足：${resourceConfig[check.resource].name}需要${check.needed}，当前${check.have}` };
    }

    if (action.cost && Object.keys(action.cost).length > 0) {
      const costChanges = {};
      for (const [k, v] of Object.entries(action.cost)) {
        costChanges[k] = -v;
      }
      updateResources(costChanges);
    }

    const actionRecord = {
      instanceId: actionIdCounter++,
      actionId: action.id,
      name: action.name,
      icon: action.icon,
      startTime: Date.now(),
      duration: action.duration,
      gain: action.gain
    };
    activeActions.value.push(actionRecord);

    addMessage(`开始${action.name}...`, 'action', action.id, null);

    setTimeout(() => {
      const idx = activeActions.value.findIndex(a => a.instanceId === actionRecord.instanceId);
      if (idx > -1) {
        activeActions.value.splice(idx, 1);
      }
      if (action.gain && Object.keys(action.gain).length > 0) {
        updateResources(action.gain);
        const gainText = Object.entries(action.gain)
          .map(([k, v]) => `+${v}${resourceConfig[k].name}`)
          .join('、');
        addMessage(`${action.name}完成！获得${gainText}`, 'success', action.id, null);
      } else {
        addMessage(`${action.name}完成！`, 'success', action.id, null);
      }
    }, action.duration);

    return { ok: true, action: actionRecord };
  };

  const exploreCell = (cellId) => {
    const cell = mapGrid.value.find(c => c.id === cellId);
    if (!cell) return { ok: false, error: '区域不存在' };
    if (cell.explored) {
      return { ok: false, error: '该区域已探索', alreadyExplored: true };
    }

    addMessage(`开始探索${cell.name}...`, 'action', null, cellId);

    return new Promise((resolve) => {
      setTimeout(() => {
        cell.explored = true;
        const random = Math.random();
        let result = {};

        if (random < 0.3) {
          const foodGain = Math.floor(Math.random() * 20) + 10;
          updateResources({ food: foodGain });
          result = { type: 'success', resource: 'food', amount: foodGain };
          addMessage(`探索${cell.name}发现了食物！获得+${foodGain}食物`, 'success', null, cellId);
        } else if (random < 0.6) {
          const woodGain = Math.floor(Math.random() * 15) + 5;
          updateResources({ wood: woodGain });
          result = { type: 'success', resource: 'wood', amount: woodGain };
          addMessage(`探索${cell.name}发现了木材！获得+${woodGain}木材`, 'success', null, cellId);
        } else if (random < 0.8) {
          const stoneGain = Math.floor(Math.random() * 10) + 5;
          updateResources({ stone: stoneGain });
          result = { type: 'success', resource: 'stone', amount: stoneGain };
          addMessage(`探索${cell.name}发现了石头！获得+${stoneGain}石头`, 'success', null, cellId);
        } else {
          updateResources({ food: -10, water: -10 });
          result = { type: 'danger', lost: { food: 10, water: 10 } };
          addMessage(`探索${cell.name}遇到危险！损失-10食物、-10水`, 'warning', null, cellId);
        }

        resolve({ ok: true, cell, result });
      }, 5000);
    });
  };

  const startResourceConsumption = () => {
    setInterval(() => {
      updateResources({ food: -5, water: -5 });
      if (resources.value.food <= 0 || resources.value.water <= 0) {
        addMessage('⚠️ 警告：食物或淡水耗尽！', 'danger');
      }
    }, 60000);
  };

  const resetGame = () => {
    resources.value = { food: 100, water: 100, wood: 100, stone: 100 };
    resourceChanges.value = { food: 0, water: 0, wood: 0, stone: 0 };
    activeActions.value = [];
    mapGrid.value = [
      { id: 0, type: 'forest', icon: '🌳', explored: true, name: '西部森林' },
      { id: 1, type: 'forest', icon: '🌳', explored: true, name: '北部森林' },
      { id: 2, type: 'mountain', icon: '🏔️', explored: false, name: '神秘山脉' },
      { id: 3, type: 'ocean', icon: '🌊', explored: false, name: '东侧海岸' },
      { id: 4, type: 'camp', icon: '🏠', explored: true, name: '主营地' },
      { id: 5, type: 'forest', icon: '🌳', explored: false, name: '南部森林' },
      { id: 6, type: 'ocean', icon: '🌊', explored: false, name: '西南海滩' },
      { id: 7, type: 'mountain', icon: '🏔️', explored: false, name: '岩石高地' },
      { id: 8, type: 'forest', icon: '🌳', explored: false, name: '幽静密林' }
    ];
    messageLog.value = [
      { id: logIdCounter++, time: '00:00', content: '重新开始游戏！', type: 'system', linkedAction: null, linkedCell: null }
    ];
  };

  return {
    resources,
    resourceChanges,
    messageLog,
    mapGrid,
    activeActions,
    actions,
    resourceConfig,
    exploredCount,
    totalCells,
    explorationProgress,
    addMessage,
    updateResources,
    performAction,
    exploreCell,
    startResourceConsumption,
    resetGame
  };
});
