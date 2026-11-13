import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Services from '@/views/Services.vue'
import Doctors from '@/views/Doctors.vue'
import Contact from '@/views/Contact.vue'
import Appointment from '@/views/Appointment.vue'
import AdminPanel from '@/views/AdminPanel.vue'
import BlogAdmin from '@/views/BlogAdmin.vue'
import BlogEditor from '@/views/BlogEditor.vue'
import Blog from '@/views/Blog.vue'
import BlogEntry from '@/views/BlogEntry.vue'
import Investigacion from '@/views/Investigacion.vue'
import Bitacora from '@/views/Bitacora.vue'
import ExamReader from '@/views/ExamReader.vue'
import CategoryAdmin from '@/views/CategoryAdmin.vue'
import ZonaIA from '@/views/ZonaIA.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/servicios',
    name: 'Services',
    component: Services
  },
  {
    path: '/especialistas',
    name: 'Doctors',
    component: Doctors
  },
  {
    path: '/contacto',
    name: 'Contact',
    component: Contact
  },
  {
    path: '/cita',
    name: 'Appointment',
    component: Appointment
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/blog',
    name: 'BlogAdmin',
    component: BlogAdmin,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/blog/editor',
    name: 'BlogEditorNew',
    component: BlogEditor,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/blog/editor/:id',
    name: 'BlogEditorEdit',
    component: BlogEditor,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/categorias',
    name: 'CategoryAdmin',
    component: CategoryAdmin,
    meta: { requiresAuth: true }
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog
  },
  {
    path: '/blog/:slug',
    name: 'BlogEntry',
    component: BlogEntry
  },
  {
    path: '/investigacion',
    name: 'Investigacion',
    component: Investigacion
  },
  {
    path: '/bitacora',
    name: 'Bitacora',
    component: Bitacora
  },
  {
    path: '/exam-reader',
    name: 'ExamReader',
    component: ExamReader
  },
  {
    path: '/examenes',
    name: 'ExamReaderAlt',
    component: ExamReader
  },
  {
    path: '/zona-ia',
    name: 'ZonaIA',
    component: ZonaIA
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router 