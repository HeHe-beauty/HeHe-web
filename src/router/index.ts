import { createRouter, createWebHistory } from 'vue-router'
import MapView from '@/views/MapView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'map',
      component: MapView,
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/LegalView.vue'),
      props: { docType: 'PRIVACY_POLICY' },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/LegalView.vue'),
      props: { docType: 'TERMS_OF_SERVICE' },
    },
    {
      path: '/account-deletion',
      name: 'account-deletion',
      component: () => import('@/views/LegalView.vue'),
      props: { docType: 'ACCOUNT_DELETION_GUIDE' },
    },
  ],
})

export default router
