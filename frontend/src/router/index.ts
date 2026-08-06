import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {isLoggedIn} from '../api/session'

// 说明：按 views 文件夹里的页面逐个登记，全部用“懒加载”，
// 这样任何一个页面写错，只坏它自己，不会拖垮整站白屏。
const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue'), meta: { title: '登录', guestOnly: true } },
  { path: '/', name: 'Root', redirect: () => isLoggedIn() ? '/chat' : '/login' },
  { path: '/chat', name: 'Chat', component: () => import('../views/ChatView.vue'), meta: { title: '对话', requiresAuth: true } },
  { path: '/account/settings', name: 'AccountSettings', component: () => import('../views/AccountSettingsView.vue'), meta: { title: '账号设置', requiresAuth: true } },
  { path: '/admin/sensitive-words', name: 'SensitiveWords', component: () => import('../views/SensitiveWordsView.vue'), meta: { title: '敏感词监管', requiresAuth: true } },
  { path: '/admin/security-logs', name: 'SecurityLogs', component: () => import('../views/SecurityLogView.vue'), meta: { title: '触发日志', requiresAuth: true } },
  { path: '/admin/alerts', name: 'Alerts', component: () => import('../views/AlertCenterView.vue'), meta: { title: '告警中心', requiresAuth: true } },
  { path: '/token', name: 'TokenQuota', component: () => import('../views/TokenQuotaView.vue'), meta: { title: 'Token 配额主控台', requiresAuth: true } },
  // 兜底：访问不存在的地址时，回到首页（避免白屏/404 空白）
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // 报红就改成 createWebHistory()
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const loggedIn = isLoggedIn()

  if (to.meta.requiresAuth && !loggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && loggedIn) {
    return '/chat'
  }

  return true
})

router.afterEach((to) => {
  const t = to.meta?.title as string | undefined
  document.title = t ? `${t} · QZ-Intelipass` : 'QZ-Intelipass'
})

export default router
