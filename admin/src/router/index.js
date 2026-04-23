import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import MaterialsView from '../views/MaterialsView.vue'
import UsersView from '../views/UsersView.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: LoginView, meta: { guest: true } },
  { path: '/dashboard', component: DashboardView, meta: { auth: true } },
  { path: '/materials', component: MaterialsView, meta: { auth: true } },
  { path: '/users', component: UsersView, meta: { auth: true } },
  { path: '/orders', component: () => import('../views/OrdersView.vue'), meta: { auth: true } },
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')

  if (to.meta.auth && !token) {
    return next('/login')
  }

  if (to.meta.guest && token) {
    return next('/dashboard')
  }

  next()
})

export default router
