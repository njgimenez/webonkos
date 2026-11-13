<template>
  <section class="features-bar">
    <div class="container">
      <div class="features-row">
        <div class="feature-block">
          <div class="feature-icon">
            <i class="fas fa-user-md"></i>
          </div>
          <div class="feature-content">
            <span class="feature-keyword">MÉDICOS PROFESIONALES</span>
            <span class="feature-subtitle">Personal amigable</span>
          </div>
        </div>

        <div class="feature-block">
          <div class="feature-icon">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="feature-content">
            <span class="feature-keyword">PRECIOS ASEQUIBLES</span>
            <span class="feature-subtitle">Con 10% de descuento</span>
          </div>
        </div>

        <div class="feature-block">
          <div class="feature-icon">
            <i class="fas fa-stethoscope"></i>
          </div>
          <div class="feature-content">
            <span class="feature-keyword">CONSULTAS</span>
            <span class="feature-subtitle">y asesoramiento médico</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'DiscreteFeatures'
}
</script>

<style lang="scss" scoped>
.features-bar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 34px 0 10px 0;
  position: relative;
  z-index: 1;

  // OCULTAR SOLO EN MÓVIL - SOLO CAMBIO MÓVIL
  @media (max-width: 768px) {
    display: none;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .features-row {
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 2rem;

    @media (max-width: 1024px) {
      gap: 1rem;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 1.5rem;
    }
  }

  .feature-block {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    justify-content: center;
    padding: 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(59, 130, 246, 0.05);
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }
  }

  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    color: white;
    font-size: 1.2rem;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

    @media (max-width: 768px) {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }
  }

  .feature-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .feature-keyword {
    font-weight: 700;
    font-size: 0.9rem;
    color: #1f2937;
    letter-spacing: 0.5px;
    text-transform: uppercase;

    @media (max-width: 768px) {
      font-size: 0.8rem;
    }
  }

  .feature-subtitle {
    font-weight: 500;
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: 0.75rem;
    }
  }
}

// Estilos específicos para la página home
.home .features-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  margin-top: -1px;

  // OCULTAR SOLO EN MÓVIL - SOLO CAMBIO MÓVIL
  @media (max-width: 768px) {
    display: none;
  }
}

// Animaciones
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-block {
  animation: fadeInUp 0.6s ease-out;
  
  &:nth-child(1) {
    animation-delay: 0.1s;
  }
  
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.3s;
  }
}

// Efectos hover mejorados
.feature-block:hover {
  .feature-icon {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }
  
  .feature-keyword {
    color: #3b82f6;
  }
}

// Responsive mejorado
@media (max-width: 1200px) {
  .features-bar {
    padding: 28px 0 8px 0;
  }
}

@media (max-width: 1024px) {
  .features-bar {
    padding: 24px 0 6px 0;
  }
  
  .feature-block {
    padding: 0.75rem;
  }
}

// OCULTAR SOLO EN MÓVIL - SOLO CAMBIO MÓVIL
@media (max-width: 768px) {
  .features-bar {
    display: none;
  }
}

@media (max-width: 480px) {
  .features-bar {
    display: none;
  }
}
</style>
