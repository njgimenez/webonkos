<template>
  <div class="date-picker-container" v-click-outside="closeCalendar">
    <div class="date-input-wrapper" @click="toggleCalendar">
      <input 
        type="text" 
        readonly 
        :value="formattedSelectedDateShort" 
        placeholder="Selecciona una fecha"
        class="date-input"
      />
      <i class="fas fa-calendar date-input-icon"></i>
    </div>

    <transition name="fade">
      <div v-if="isOpen" class="date-picker-dropdown">
        <div class="date-picker__header">
          <button 
            type="button"
            class="date-picker__nav" 
            @click.stop="previousMonth"
            :disabled="isPreviousMonthDisabled"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <div class="date-picker__current-month">
            {{ currentMonthLabel }}
          </div>
          
          <button 
            type="button"
            class="date-picker__nav" 
            @click.stop="nextMonth"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        
        <div class="date-picker__quick-actions">
          <button 
            type="button"
            class="date-picker__today-btn"
            @click.stop="selectToday"
            :disabled="isTodayDisabled"
          >
            <i class="fas fa-calendar-day"></i>
            Hoy
          </button>
        </div>
        
        <div class="date-picker__weekdays">
          <div class="date-picker__weekday">Lu</div>
          <div class="date-picker__weekday">Ma</div>
          <div class="date-picker__weekday">Mi</div>
          <div class="date-picker__weekday">Ju</div>
          <div class="date-picker__weekday">Vi</div>
          <div class="date-picker__weekday">Sa</div>
          <div class="date-picker__weekday date-picker__weekday--sunday">Do</div>
        </div>
        
        <div class="date-picker__days">
          <button
            type="button"
            v-for="day in calendarDays"
            :key="day.key"
            class="date-picker__day"
            :class="{
              'date-picker__day--empty': day.isEmpty,
              'date-picker__day--disabled': day.isDisabled,
              'date-picker__day--selected': day.isSelected,
              'date-picker__day--today': day.isToday,
              'date-picker__day--sunday': day.isSunday
            }"
            :disabled="day.isEmpty || day.isDisabled"
            @click.stop="selectDate(day)"
          >
            {{ day.label }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'DatePicker',
  props: {
    modelValue: {
      type: String,
      default: null
    },
    minDate: {
      type: String,
      default: null
    },
    disableSundays: {
      type: Boolean,
      default: true
    }
  },
  directives: {
    'click-outside': {
      beforeMount(el, binding) {
        el.clickOutsideEvent = (event) => {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value();
          }
        };
        document.addEventListener('click', el.clickOutsideEvent);
      },
      unmounted(el) {
        document.removeEventListener('click', el.clickOutsideEvent);
      }
    }
  },
  data() {
    return {
      isOpen: false,
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth()
    }
  },
  computed: {
    currentMonthLabel() {
      const date = new Date(this.currentYear, this.currentMonth, 1)
      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    },
    
    formattedSelectedDateShort() {
      if (!this.modelValue) return ''
      const date = new Date(this.modelValue + 'T00:00:00')
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    },

    calendarDays() {
      const days = []
      const firstDay = new Date(this.currentYear, this.currentMonth, 1)
      const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0)
      
      let firstDayOfWeek = firstDay.getDay() - 1
      if (firstDayOfWeek === -1) firstDayOfWeek = 6
      
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({
          key: `empty-${i}`,
          label: '',
          isEmpty: true,
          isDisabled: true
        })
      }
      
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(this.currentYear, this.currentMonth, day)
        const dateString = this.formatDate(date)
        
        days.push({
          key: dateString,
          label: day,
          date: date,
          dateString: dateString,
          isEmpty: false,
          isDisabled: this.isDateDisabled(date),
          isSelected: this.modelValue === dateString,
          isToday: this.isToday(date),
          isSunday: date.getDay() === 0
        })
      }
      
      return days
    },
    
    isTodayDisabled() {
      const today = new Date()
      return this.isDateDisabled(today)
    },
    
    isPreviousMonthDisabled() {
      const today = new Date()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      return this.currentYear < currentYear || (this.currentYear === currentYear && this.currentMonth <= currentMonth)
    }
  },
  methods: {
    toggleCalendar() {
      this.isOpen = !this.isOpen
    },
    closeCalendar() {
      this.isOpen = false
    },
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    isToday(date) {
      const today = new Date()
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear()
    },
    isDateDisabled(date) {
      if (this.disableSundays && date.getDay() === 0) return true
      if (this.minDate) {
        const min = new Date(this.minDate + 'T00:00:00')
        if (date < min) return true
      }
      return false
    },
    selectDate(day) {
      if (day.isEmpty || day.isDisabled) return
      this.$emit('update:modelValue', day.dateString)
      this.isOpen = false
    },
    selectToday() {
      const today = new Date()
      if (!this.isDateDisabled(today)) {
        const todayString = this.formatDate(today)
        this.$emit('update:modelValue', todayString)
        this.isOpen = false
      }
    },
    previousMonth() {
      if (this.isPreviousMonthDisabled) return
      if (this.currentMonth === 0) {
        this.currentMonth = 11
        this.currentYear--
      } else {
        this.currentMonth--
      }
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0
        this.currentYear++
      } else {
        this.currentMonth++
      }
    }
  },
  mounted() {
    if (this.modelValue) {
      const selectedDate = new Date(this.modelValue + 'T00:00:00')
      this.currentYear = selectedDate.getFullYear()
      this.currentMonth = selectedDate.getMonth()
    }
  }
}
</script>

<style lang="scss" scoped>
.date-picker-container {
  position: relative;
  width: 100%;
}

.date-input-wrapper {
  position: relative;
  cursor: pointer;
}

.date-input {
  width: 100%;
  padding: 12px 40px 12px 16px !important;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  height: 48px;
  line-height: normal;
  
  &:focus {
    outline: none;
    border-color: #1e3a8a;
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  }
}

.date-input-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #1e3a8a;
  pointer-events: none;
}

.date-picker-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #667eea40;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 100%;
  min-width: 280px;
}

.date-picker__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.date-picker__current-month {
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
}

.date-picker__nav {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  &:hover:not(:disabled) { background: #1e3a8a; color: white; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
}

.date-picker__quick-actions {
  margin-bottom: 0.8rem;
}

.date-picker__today-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #1e3a8a;
  border-radius: 6px;
  background: transparent;
  color: #1e3a8a;
  font-weight: 500;
  cursor: pointer;
  &:hover:not(:disabled) { background: #1e3a8a; color: white; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.date-picker__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 5px;
}

.date-picker__weekday {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #999;
  &--sunday { color: #dc3545; }
}

.date-picker__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.date-picker__day {
  height: 35px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled):not(.date-picker__day--empty) { background: #f0f7ff; color: #1e3a8a; }
  &--disabled { color: #ccc; cursor: not-allowed; }
  &--sunday { color: #999; background: #fff5f5; }
  &--selected { background: #1e3a8a !important; color: white !important; font-weight: bold; }
  &--today { border: 1px solid #059669; color: #059669; }
  &--empty { cursor: default; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
