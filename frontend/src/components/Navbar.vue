<template>
  <nav class="navbar" :class="{ 'navbar--scrolled': isScrolled, 'navbar--home': isHomePage }">
    <!-- Barra superior azul oscuro solo para Home -->
    <div v-if="isHomePage" class="navbar__top-bar">
      <div class="container">
        <div class="navbar__top-content">
          <div class="navbar__top-left">
            <span class="navbar__top-text">Centro de Investigación y Tratamientos contra el cáncer</span>
          </div>
          <div class="navbar__top-actions">
            <button @click="showAppointmentModalAndCloseMenu" class="navbar__top-btn navbar__top-btn--cta">
              <i class="fas fa-calendar-alt"></i>
              <span class="navbar__top-btn-text">Agendar Cita</span>
            </button>
            
            <!-- ZONA IA -->
            <button @click="navigateToZonaIA" class="navbar__top-btn navbar__top-btn--ai" title="ZONA IA - Herramientas de IA">
              <i class="fas fa-brain"></i>
              <span class="navbar__top-btn-text">Oncosapien</span>
            </button>
            
            <button @click="showAdminLogin" class="navbar__top-btn navbar__top-btn--admin" title="Acceso Administrativo">
              <i class="fas fa-cog"></i>
              <span class="navbar__top-btn-text">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="navbar__content">
        <router-link to="/" class="navbar__logo">
          <img src="@/assets/images/logo.png" alt="Onkos Instituto del Cáncer" class="navbar__logo-img">
        </router-link>
        
        <div class="navbar__menu" :class="{ 'navbar__menu--open': isMenuOpen }">
          <!-- Logo en el menú móvil - SOLO MÓVIL -->
          <div class="navbar__mobile-logo">
            <img src="@/assets/LOGO2.png" alt="Onkos Instituto del Cáncer" class="navbar__mobile-logo-img">
          </div>
          
          <router-link to="/" class="navbar__link" @click="closeMenu">Inicio</router-link>
          
          <!-- Nosotros (abre entrada del blog) -->
          <button class="navbar__link" @click="openBlogEntryByTitle('Nosotros')">Nosotros</button>
          
          <!-- Unidades -->
          <div class="navbar__dropdown" @mouseenter="openDropdown('unidades')" @mouseleave="closeDropdown('unidades')">
            <button class="navbar__dropdown-toggle" @click="toggleMobileDropdown('unidades')">
              Unidades
              <i class="fas fa-chevron-down" :class="{ 'fa-chevron-up': activeDropdown === 'unidades' }"></i>
            </button>
            <div class="navbar__dropdown-menu" :class="{ 'navbar__dropdown-menu--open': activeDropdown === 'unidades' }">
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Oncología Médica')">Oncología Médica</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Oncología Quirúrgica')">Oncología Quirúrgica</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Radiología Oncológica')">Radiología Oncológica</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Ginecología Oncológica')">Ginecología Oncológica</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Gastro Oncología')">Gastro Oncología</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Urología Oncológica')">Urología Oncológica</button>
            </div>
          </div>
          
          <!-- Programas -->
          <div class="navbar__dropdown" @mouseenter="openDropdown('programas')" @mouseleave="closeDropdown('programas')">
            <button class="navbar__dropdown-toggle" @click="toggleMobileDropdown('programas')">
              Programas
              <i class="fas fa-chevron-down" :class="{ 'fa-chevron-up': activeDropdown === 'programas' }"></i>
            </button>
            <div class="navbar__dropdown-menu" :class="{ 'navbar__dropdown-menu--open': activeDropdown === 'programas' }">
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Onkos Humano')">Onkos Humano</button>
              
              <!-- Submenu Red Onkos -->
              <div class="navbar__submenu">
                <div class="navbar__submenu-title">Red Onkos</div>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Médicos Asociados')">Médicos Asociados</button>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Centros Asociados')">Centros Asociados</button>
              </div>
              
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Diagnóstico Rápido')">Diagnóstico Rápido</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Opinión Experta')">Opinión Experta</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Teleoncología')">Teleoncología</button>
            </div>
          </div>
          
          <!-- Terapias -->
          <div class="navbar__dropdown" @mouseenter="openDropdown('terapias')" @mouseleave="closeDropdown('terapias')">
            <button class="navbar__dropdown-toggle" @click="toggleMobileDropdown('terapias')">
              Terapias
              <i class="fas fa-chevron-down" :class="{ 'fa-chevron-up': activeDropdown === 'terapias' }"></i>
            </button>
            <div class="navbar__dropdown-menu" :class="{ 'navbar__dropdown-menu--open': activeDropdown === 'terapias' }">
              
              <!-- Terapias Sistémicas -->
              <div class="navbar__submenu">
                <div class="navbar__submenu-title">Terapias Sistémicas</div>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Quimioterapia')">Quimioterapia</button>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Moleculares')">Moleculares</button>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Inmunoterapia')">Inmunoterapia</button>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Reposicionamiento')">Reposicionamiento</button>
              </div>
              
              <!-- Terapias Locorregionales -->
              <div class="navbar__submenu">
                <div class="navbar__submenu-title">Terapias Locorregionales</div>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Terapias Intra Peritoneales (TIPs)')">Terapias Intra Peritoneales (TIPs)</button>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Terapias Intratumorales (TITS)')">Terapias Intratumorales (TITS)</button>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Inmunoterapia Amplificada (ITA)')">Inmunoterapia Amplificada (ITA)</button>
              </div>
              
              <!-- Terapias de Soporte -->
              <div class="navbar__submenu">
                <div class="navbar__submenu-title">Terapias de Soporte</div>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Terapia Molecular Antálgica (TMA)')">Terapia Molecular Antálgica (TMA)</button>
                <button class="navbar__submenu-link" @click="openBlogEntryByTitle('Convencionales')">Convencionales</button>
              </div>
            </div>
          </div>
          
          <!-- Soporte -->
          <div class="navbar__dropdown" @mouseenter="openDropdown('soporte')" @mouseleave="closeDropdown('soporte')">
            <button class="navbar__dropdown-toggle" @click="toggleMobileDropdown('soporte')">
              Soporte
              <i class="fas fa-chevron-down" :class="{ 'fa-chevron-up': activeDropdown === 'soporte' }"></i>
            </button>
            <div class="navbar__dropdown-menu" :class="{ 'navbar__dropdown-menu--open': activeDropdown === 'soporte' }">
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Vitamina C')">Vitamina C</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Muérdago')">Muérdago</button>
              <button class="navbar__dropdown-link" @click="openBlogEntryByTitle('Nutracéutica')">Nutracéutica</button>
            </div>
          </div>
          
          <!-- Investigación -->
          <router-link to="/investigacion" class="navbar__link" @click="closeMenu">Investigación</router-link>
          
          <!-- Bitácora -->
          <router-link to="/bitacora" class="navbar__link" @click="closeMenu">Bitácora</router-link>
          
          <!-- Blog -->
          <router-link to="/blog" class="navbar__link" @click="closeMenu">Blog</router-link>
          
          <router-link to="/contacto" class="navbar__link" @click="closeMenu">Contáctenos</router-link>
        </div>
        
        <button class="navbar__toggle" @click="toggleMenu" :class="{ 'navbar__toggle--active': isMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  data() {
    return {
      isScrolled: false,
      isMenuOpen: false,
      activeDropdown: null
    }
  },
  computed: {
    isHomePage() {
      return this.$route.path === '/'
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    handleScroll() {
      this.isScrolled = window.scrollY > 50
    },
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
      document.body.style.overflow = this.isMenuOpen ? 'hidden' : ''
    },
    closeMenu() {
      this.isMenuOpen = false
      this.activeDropdown = null
      document.body.style.overflow = ''
    },
    openDropdown(dropdown) {
      // Solo abrir en desktop (hover)
      if (window.innerWidth > 768) {
        this.activeDropdown = dropdown
      }
    },
    closeDropdown(dropdown) {
      if (this.activeDropdown === dropdown) {
        this.activeDropdown = null
      }
    },
    toggleMobileDropdown(dropdown) {
      // Solo funcionar en móvil
      if (window.innerWidth <= 768) {
        this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown
      }
    },
    showAdminLogin() {
      this.$emit('show-admin-login')
    },
    showAppointmentModal() {
      this.$emit('show-appointment-modal')
    },
    showAppointmentModalAndCloseMenu() {
      this.closeMenu();
      this.showAppointmentModal();
    },
    navigateToZonaIA() {
      this.closeMenu();
      this.$router.push('/zona-ia');
    },
    openBlogEntryByTitle(title) {
      this.closeMenu();
      // Convertir título a slug (minúsculas, sin acentos, espacios por guiones)
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
        .replace(/\s+/g, '-') // Espacios por guiones
        .replace(/-+/g, '-') // Múltiples guiones por uno solo
        .trim();
      
      this.$router.push({
        name: 'BlogEntry',
        params: { slug: slug }
      });
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";
@import "@/assets/styles/mixins.scss";

.navbar {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10010;
  transition: all 0.3s ease;

  &--scrolled {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  &--home {
    background: transparent;
    box-shadow: none;

    &.navbar--scrolled {
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
  }

  &__top-bar {
    background: $navbar-top-bg;
    color: white;
    padding: 0.5rem 0;
    font-size: 0.85rem;
    z-index: 10011;

    // MOSTRAR EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      display: block;
      padding: 0.3rem 0;
      font-size: 0.75rem;
    }
  }

  &__top-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    // LAYOUT VERTICAL EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  &__top-left {
    flex: 1;

    // CENTRAR EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      text-align: center;
      flex: none;
    }
  }

  &__top-text {
    font-weight: 500;

    // TEXTO MÁS PEQUEÑO EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      font-size: 0.7rem;
    }
  }

  &__top-actions {
    display: flex;
    gap: 1rem;
    align-items: center;

    // AJUSTES MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  &__top-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
    }

    &--cta {
      background: $cta-color;
      border-color: $cta-color;

      &:hover {
        background: darken($cta-color, 8%);
        border-color: darken($cta-color, 8%);
      }
    }

    &--ai {
      background: $cta-color;
      border-color: $cta-color;

      &:hover {
        background: darken($cta-color, 8%);
        border-color: darken($cta-color, 8%);
      }
    }

    &--admin {
      background: $cta-color;
      border-color: $cta-color;

      &:hover {
        background: darken($cta-color, 8%);
        border-color: darken($cta-color, 8%);
      }
    }

    // BOTONES MÁS PEQUEÑOS EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      padding: 0.3rem 0.6rem;
      font-size: 0.7rem;
      gap: 0.3rem;
    }
  }

  &__top-btn-text {
    @media (max-width: 1024px) {
      display: none;
    }

    // MOSTRAR TEXTO EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      display: inline;
    }
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 0;
    position: relative;
  }

  &__logo {
    display: flex;
    align-items: center;
    height: 90px;
    text-decoration: none;
    z-index: 10012;
    position: relative;
  }

  &__logo-img {
    height: 100%;
    width: auto;
    max-width: 200px;
    pointer-events: none;
    
    @media (max-width: 768px) {
      height: 35px;
      max-width: 130px;
    }
  }

  &__menu {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 1;
    justify-content: center;
    
    @media (max-width: 1200px) {
      gap: 1rem;
    }
    
    @media (max-width: 1024px) {
      gap: 0.75rem;
    }
    
    // MENÚ MÓVIL CORREGIDO - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      flex-direction: column;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      transform: translateX(-100%);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      overflow-y: auto;
      z-index: 10015;
      
      &--open {
        transform: translateX(0);
        opacity: 1;
        visibility: visible;
      }
    }
  }

  // LOGO EN MENÚ MÓVIL - SOLO MÓVIL
  &__mobile-logo {
    display: none;
    justify-content: center;
    padding: 1rem 0 2rem;
    border-bottom: 2px solid #1e3a8a;
    margin-bottom: 1rem;

    @media (max-width: 768px) {
      display: flex;
    }
  }

  &__mobile-logo-img {
    height: 60px;
    width: auto;
    max-width: 200px;
  }

  &__link {
    color: $text-primary;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: color 0.3s ease;
    white-space: nowrap;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    line-height: 1.2;
    
    &:hover,
    &.router-link-active {
      color: $primary-color;
    }
    
    // ALINEACIÓN IZQUIERDA EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      padding: 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      width: 100%;
      text-align: left;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }

  &__dropdown {
    position: relative;
  }

  &__dropdown-toggle {
    background: none;
    border: none;
    color: $text-primary;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.3s ease;
    padding: 0;
    line-height: 1.2;
    white-space: nowrap;

    &:hover {
      color: $primary-color;
    }

    i {
      font-size: 0.7rem;
      transition: transform 0.3s ease;
    }

    // ALINEACIÓN IZQUIERDA EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-between;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      font-size: 1rem;
      font-weight: 600;
      text-align: left;

      i {
        transition: transform 0.3s ease;
      }
    }
  }

  &__dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    padding: 0.5rem 0;
    min-width: 200px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    z-index: 10020;

    &--open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    // DROPDOWNS COLAPSADOS EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      position: static;
      opacity: 0;
      visibility: hidden;
      transform: none;
      box-shadow: none;
      border: none;
      background: rgba(0, 0, 0, 0.02);
      margin-top: 0;
      border-radius: 8px;
      padding: 0;
      max-height: 0;
      overflow: hidden;
      transition: all 0.3s ease;
      z-index: 10016;
      
      &--open {
        opacity: 1;
        visibility: visible;
        max-height: 500px;
        padding: 0.5rem 0;
      }
    }
  }

  &__dropdown-link {
    display: block;
    padding: 0.75rem 1rem;
    color: $text-primary;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: $primary-color;
    }

    // ALINEACIÓN IZQUIERDA EN MÓVIL - SOLO CAMBIO MÓVIL
    @media (max-width: 768px) {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 0.9rem;
      font-weight: 500;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }

  &__submenu {
    margin: 0.5rem 0;
    padding: 0.5rem 0;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;

    @media (max-width: 768px) {
      margin: 0.5rem 0;
      padding: 0.5rem 0;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 6px;
    }
  }

  &__submenu-title {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;

    @media (max-width: 768px) {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 700;
    }
  }

  &__submenu-link {
    display: block;
    padding: 0.5rem 1rem 0.5rem 2rem;
    color: $text-primary;
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: 400;
    transition: all 0.3s ease;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: $primary-color;
    }

    @media (max-width: 768px) {
      padding: 0.5rem 1rem 0.5rem 2rem;
      font-size: 0.85rem;
      font-weight: 400;
    }
  }

  &__toggle {
    display: none;
    flex-direction: column;
    justify-content: space-around;
    width: 30px;
    height: 30px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 10020;
    position: relative;

    span {
      display: block;
      height: 3px;
      width: 100%;
      background: $text-primary;
      border-radius: 2px;
      transition: all 0.3s ease;
      transform-origin: center;
    }

    &--active {
      span:nth-child(1) {
        transform: rotate(45deg) translate(6px, 6px);
      }

      span:nth-child(2) {
        opacity: 0;
      }

      span:nth-child(3) {
        transform: rotate(-45deg) translate(6px, -6px);
      }
    }

    @media (max-width: 768px) {
      display: flex;
    }
  }

  &__cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #f87171;
    color: white;
    font-weight: 600;
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    box-shadow: 0 3px 10px rgba(248, 113, 113, 0.25);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    transition: all 0.3s ease;
    white-space: nowrap;
    
    &:hover {
      background: darken(#f87171, 8%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(248, 113, 113, 0.35);
      color: white;
    }
    
    i {
      font-size: 0.9rem;
    }
    
    @media (max-width: 1024px) {
      .navbar__cta-text {
        display: none;
      }
      
      padding: 0.5rem;
      border-radius: 50%;
      
      i {
        margin: 0;
      }
    }
  }
}
</style>
