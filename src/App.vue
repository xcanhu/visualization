<script setup lang="ts">
// App.vue作为根组件，主要负责布局和路由视图的渲染
</script>

<template>
  <div class="app-container">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* 全局样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  overflow: hidden; /* 防止滚动条出现导致布局偏移 */
}

#app {
  height: 100%;
  width: 100%;
  overflow: hidden; /* 确保应用容器不会有滚动条 */
}

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
}

/* 对所有主要页面容器进行通用样式调整 */
.home-container,
.visualization-container,
.map-container,
.chart-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 对所有页面的主体内容区域进行统一样式调整 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 对所有侧边栏进行统一样式调整 */
.sidebar {
  width: 60px;
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar:hover {
  width: 180px;
}

/* 对所有内容区域进行统一样式调整 */
.content {
  flex: 1;
  overflow: auto;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
