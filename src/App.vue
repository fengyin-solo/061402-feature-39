<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
});

onMounted(() => {
  console.log('🏝️ 海岛生存游戏启动！');
});
</script>

<style>
a {
  text-decoration: none;
  color: inherit;
}
</style>