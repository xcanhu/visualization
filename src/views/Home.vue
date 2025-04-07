<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { 
  House, 
  DataAnalysis, 
  Location, 
  DataLine 
} from '@element-plus/icons-vue'

const router = useRouter()

// 导航菜单项
const navItems = [
  { name: '首页', path: '/', icon: House },
  { name: '数据可视化平台', path: '/visualization', icon: DataAnalysis },
  { name: '地图数据', path: '/map', icon: Location },
  { name: '实时图表', path: '/chart', icon: DataLine }
]

// 跳转到指定路由
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="logo">
        <div class="logo-icon"></div>
        <h1>大数据可视化监控平台</h1>
      </div>
    </header>
    
    <!-- 主体内容 -->
    <div class="main-content">
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <div 
            v-for="item in navItems" 
            :key="item.path"
            class="nav-item"
            :class="{ active: $route.path === item.path }"
            @click="navigateTo(item.path)"
          >
            <span class="nav-icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <span class="nav-text">{{ item.name }}</span>
          </div>
        </nav>
      </aside>
      
      <!-- 右侧内容区 -->
      <main class="content">
        <div class="welcome-section">
          <h2>欢迎使用大数据可视化监控平台</h2>
          <p class="tech-description">基于Vue3 + TypeScript + Three.js + WebGL + ECharts构建的现代化数据可视化平台</p>
          
          <div class="feature-cards">
            <div class="feature-card" @click="navigateTo('/visualization')">
              <div class="card-icon visualization-icon"></div>
              <div class="card-content">
                <h3>数据可视化平台</h3>
                <p>多种图表类型支持自定义数据源</p>
                <div class="card-tech-tags">
                  <span class="tech-tag">ECharts</span>
                  <span class="tech-tag">实时数据</span>
                  <span class="tech-tag">自定义</span>
                </div>
              </div>
            </div>
            <div class="feature-card" @click="navigateTo('/map')">
              <div class="card-icon location-icon"></div>
              <div class="card-content">
                <h3>地图数据</h3>
                <p>基于Three.js的3D地理数据可视化</p>
                <div class="card-tech-tags">
                  <span class="tech-tag">Three.js</span>
                  <span class="tech-tag">WebGL</span>
                  <span class="tech-tag">GeoJSON</span>
                </div>
              </div>
            </div>
            <div class="feature-card" @click="navigateTo('/chart')">
              <div class="card-icon chart-icon"></div>
              <div class="card-content">
                <h3>实时图表</h3>
                <p>基于WebSocket的实时数据更新与动态渲染</p>
                <div class="card-tech-tags">
                  <span class="tech-tag">WebSocket</span>
                  <span class="tech-tag">ECharts</span>
                  <span class="tech-tag">实时数据</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 技术栈展示 -->
          <div class="tech-showcase">
            <h3>核心技术栈</h3>
            <div class="tech-list">
              <div class="tech-item">
                <div class="tech-icon vue-icon"></div>
                <span>Vue 3</span>
              </div>
              <div class="tech-item">
                <div class="tech-icon ts-icon"></div>
                <span>TypeScript</span>
              </div>
              <div class="tech-item">
                <div class="tech-icon threejs-icon"></div>
                <span>Three.js</span>
              </div>
              <div class="tech-item">
                <div class="tech-icon webgl-icon"></div>
                <span>WebGL</span>
              </div>
              <div class="tech-item">
                <div class="tech-icon echarts-icon"></div>
                <span>ECharts</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #001529;
  color: white;
  position: relative;
  overflow: hidden;
}

/* 顶部导航栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  padding: 0 30px;
  background-color: rgba(0, 21, 41, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff, #722ed1);
  margin-right: 15px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.7);
}

.logo-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(transparent, rgba(255, 255, 255, 0.8), transparent 30%);
  animation: rotate 4s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

.logo h1 {
  font-size: 1.8rem;
  margin: 0;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
  font-weight: 700;
  letter-spacing: 1px;
}

/* 主体内容 */
.main-content {
  display: flex;
  flex: 1;
  height: calc(100vh - 70px);
}

/* 侧边栏 */
.sidebar {
  width: 60px;
  background-color: #001529;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 0;
  overflow: hidden;
  transition: width 0.3s;
}

.sidebar:hover {
  width: 180px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  margin: 0 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.3s;
  white-space: nowrap;
}

.nav-item:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: white;
  background-color: #1890ff;
}

.nav-icon {
  font-size: 18px;
  margin-right: 10px;
}

.nav-text {
  opacity: 0;
  transition: opacity 0.2s;
}

.sidebar:hover .nav-text {
  opacity: 1;
}

/* 内容区 */
.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #001f3f;
}

.welcome-section {
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-section h2 {
  font-size: 2.2rem;
  margin-top: 0;
  margin-bottom: 15px;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
  letter-spacing: 1px;
}

.tech-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
  line-height: 1.6;
  position: relative;
  padding-left: 15px;
  border-left: 3px solid #1890ff;
}

/* 特性卡片 */
.feature-cards {
  display: flex;
  gap: 25px;
  margin-top: 40px;
}

.feature-card {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  height: 280px;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.2), rgba(114, 46, 209, 0.2));
  opacity: 0;
  transition: opacity 0.4s ease;
}

.feature-card:hover {
  transform: translateY(-15px) scale(1.03);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(24, 144, 255, 0.4);
  border-color: rgba(24, 144, 255, 0.5);
}

.feature-card:hover::before {
  opacity: 1;
}

.card-icon {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.card-icon::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.feature-card:hover .card-icon::after {
  left: 100%;
}

.location-icon, .chart-icon, .dashboard-icon, .test-icon {
  width: 50px;
  height: 50px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 8px rgba(24, 144, 255, 0.7));
}

.location-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231890ff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>');
}

.chart-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231890ff"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>');
}

.dashboard-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231890ff"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>');
}

.test-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231890ff"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L11 13.17l7.59-7.59L20 7l-8 8z"/></svg>');
}

.card-content {
  padding: 20px;
}

.feature-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #1890ff;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  position: relative;
  display: inline-block;
}

.feature-card h3::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  transition: width 0.3s ease;
}

.feature-card:hover h3::after {
  width: 100%;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 15px;
  font-size: 1rem;
  line-height: 1.5;
}

.card-tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}

.tech-tag {
  padding: 5px 10px;
  background-color: rgba(24, 144, 255, 0.2);
  border-radius: 20px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.feature-card:hover .tech-tag {
  background-color: rgba(24, 144, 255, 0.3);
  border-color: rgba(24, 144, 255, 0.5);
  box-shadow: 0 0 10px rgba(24, 144, 255, 0.3);
}

/* 技术栈展示 */
.tech-showcase {
  margin-top: 50px;
  padding: 25px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tech-showcase h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: white;
  font-size: 1.4rem;
  text-align: center;
  position: relative;
}

.tech-showcase h3::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #1890ff, #722ed1);
}

.tech-list {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
}

.tech-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.tech-item:hover {
  transform: translateY(-5px);
}

.tech-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tech-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(transparent, rgba(255, 255, 255, 0.1), transparent 30%);
  animation: rotate 4s linear infinite;
}

.vue-icon, .ts-icon, .threejs-icon, .webgl-icon, .echarts-icon {
  width: 40px;
  height: 40px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 5px rgba(24, 144, 255, 0.5));
}

.vue-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 196.32 170.02"><path fill="%2341B883" d="M120.83 0L98.16 39.26 75.49 0H0l98.16 170.02L196.32 0h-75.49z"/><path fill="%2334495E" d="M120.83 0L98.16 39.26 75.49 0H39.26l58.9 102.01L157.06 0h-36.23z"/></svg>');
}

.ts-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><path fill="%233178c6" d="M0 200V0h400v400H0"/><path fill="%23fff" d="M87.7 200.7V217h52v148h36.9V217h52v-16c0-9 0-16.3-.4-16.5 0-.3-31.7-.4-70.2-.4l-70 .3v16.4l-.3-.1zM321.4 184c10.2 2.4 18 7 25 14.3 3.7 4 9.2 11 9.6 12.8 0 .6-17.3 12.3-27.8 18.8-.4.3-2-1.4-3.6-4-5.2-7.4-10.5-10.6-18.8-11.2-12-.8-20 5.5-20 16 0 3.2.6 5 1.8 7.6 2.7 5.5 7.7 8.8 23.2 15.6 28.6 12.3 41 20.4 48.5 32 8.5 13 10.4 33.4 4.7 48.7-6.4 16.7-22 28-44.3 31.7-7 1.2-23 1-30.5-.3-16-3-31.3-11-40.7-21.3-3.7-4-10.8-14.7-10.4-15.4l3.8-2.4 15-8.7 11.3-6.6 2.6 3.5c3.3 5.2 10.7 12.2 15 14.6 13 6.7 30.4 5.8 39-2 3.7-3.4 5.3-7 5.3-12 0-4.6-.7-6.7-3-10.2-3.2-4.4-9.6-8-27.6-16-20.7-8.8-29.5-14.4-37.7-23-4.7-5.2-9-13.3-11-20-1.5-5.8-2-20-.6-25.7 4.3-20 19.4-34 41-38 7-1.4 23.5-.8 30.4 1l-.2.2z"/></svg>');
}

.threejs-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="27 26 173.23 174.94"><g fill="white"><path d="M92.11 26a10 10 0 0 0-1.5.1c-8.82 1.34-15.29 9.37-14.4 18.2a16.3 16.3 0 0 0 14.26 14.25c8.84.9 16.87-5.55 18.2-14.37 1.4-9.24-4.9-17.87-14.1-18.09a12.9 12.9 0 0 0-2.46-.1zm36.85 26.61a16.17 16.17 0 0 0-2.42.11c-8.83.95-15.74 8.72-15.31 17.62.44 9.2 8.58 16.13 17.8 15.31 8.83-.78 15.74-8.54 15.32-17.44-.4-8.7-7.65-15.44-15.39-15.6zm-75.37 20.5a16.2 16.2 0 0 0-2.35.11c-8.85 1.03-15.68 8.9-15.13 17.8.56 9.2 8.78 16.05 17.98 15.13 8.83-.87 15.66-8.72 15.13-17.62-.5-8.7-7.8-15.36-15.63-15.42zm38.44 33.9c-9.33.2-16.45 8.32-15.67 17.63.76 9.07 8.9 15.8 17.98 14.92 8.83-.86 15.67-8.71 15.14-17.62-.5-8.7-8.32-15.13-17.45-14.93zm37.28 20.65a16.25 16.25 0 0 0-2.42.12c-8.83.95-15.74 8.71-15.31 17.62.44 9.2 8.58 16.13 17.8 15.31 8.83-.78 15.74-8.54 15.32-17.44-.4-8.7-7.65-15.44-15.39-15.6zm-75.22 20.65a16.25 16.25 0 0 0-2.42.12c-8.83.95-15.74 8.71-15.31 17.62.44 9.2 8.58 16.13 17.8 15.31 8.83-.78 15.74-8.54 15.32-17.44-.4-8.7-7.65-15.44-15.39-15.6zm37.92 22.01c-9.33.2-16.45 8.32-15.67 17.63.76 9.07 8.9 15.8 17.98 14.92 8.83-.86 15.67-8.71 15.14-17.62-.5-8.7-8.32-15.13-17.45-14.93z"/></g></svg>');
}

.webgl-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 630"><g fill="%23e44d26"><path d="M212.3 28.9l-22.5 253.4 203.2 56.4V28.9h-180.7zm-13.5 303.8l-28.7 319.1 224.3-62.2.5-256.9h-196.1z"/></g><g fill="%23f16529"><path d="M404.3 28.9v309.8h181.2l-17 190.6-164.2 45.4V630l301.5-83.4 2.2-24.6 34.7-387.7 3.6-40.4H404.3z"/></g></svg>');
}

.echarts-icon {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><path fill="%23293c55" d="M0 0h400v400H0z"/><g fill="%234c8dff"><path d="M50 175h50v175H50z"/><path d="M150 125h50v225h-50z"/><path d="M250 75h50v275h-50z"/><path d="M350 25h50v325h-50z"/></g></svg>');
}

.tech-item span {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .feature-cards {
    flex-direction: column;
  }
  
  .feature-card {
    height: auto;
  }
  
  .tech-list {
    gap: 15px;
  }
}

@media (max-width: 992px) {
  .header {
    flex-direction: column;
    height: auto;
    padding: 15px;
    gap: 15px;
  }
  
  .main-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 20px;
  }
  
  .content {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .logo h1 {
    font-size: 1.4rem;
  }
  
  .welcome-section h2 {
    font-size: 1.8rem;
  }
  
  .tech-description {
    font-size: 1rem;
  }
  
  .tech-list {
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .welcome-section {
    padding: 20px;
  }
  
  .welcome-section h2 {
    font-size: 1.5rem;
  }
  
  .tech-showcase h3 {
    font-size: 1.2rem;
  }
}

.card-icon.visualization-icon {
  background-image: linear-gradient(135deg, #2979ff, #5c6bc0);
  position: relative;
}

.card-icon.visualization-icon::before {
  content: "";
  position: absolute;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
</style>