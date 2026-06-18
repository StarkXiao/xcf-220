<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { StoryEvent, StoryDialogue, StoryChoice, ActiveStoryEvent, CodexEntry, StoryReward } from '../game/types'
import { getStoryEventById, getCurrentDialogue, advanceDialogue, makeChoice } from '../game/storyStore'
import { unlockCodexEntry } from '../game/codexStore'

const props = defineProps<{
  activeEvent: ActiveStoryEvent | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'codexUnlock', entry: CodexEntry): void
  (e: 'reward', reward: StoryReward): void
}>()

const showing = ref(false)
const consequenceText = ref<string | null>(null)
const displayText = ref('')
const textAnimating = ref(false)
const textAnimTimer = ref<number | null>(null)

const event = computed<StoryEvent | null>(() => {
  if (!props.activeEvent) return null
  return getStoryEventById(props.activeEvent.eventId)
})

const dialogue = computed<StoryDialogue | null>(() => {
  if (!event.value || !props.activeEvent) return null
  return getCurrentDialogue(event.value, props.activeEvent)
})

const hasChoices = computed(() => {
  return dialogue.value?.choices && dialogue.value.choices.length > 0
})

watch(() => props.activeEvent, (newVal) => {
  showing.value = !!newVal
  if (newVal) {
    consequenceText.value = null
    animateText()
  }
}, { immediate: true })

watch(dialogue, () => {
  if (dialogue.value) {
    animateText()
  }
})

function animateText() {
  if (!dialogue.value) return
  
  if (textAnimTimer.value) {
    clearInterval(textAnimTimer.value)
    textAnimTimer.value = null
  }
  
  displayText.value = ''
  textAnimating.value = true
  const fullText = dialogue.value.text
  let index = 0
  
  textAnimTimer.value = window.setInterval(() => {
    if (index < fullText.length) {
      displayText.value += fullText[index]
      index++
    } else {
      textAnimating.value = false
      if (textAnimTimer.value) {
        clearInterval(textAnimTimer.value)
        textAnimTimer.value = null
      }
    }
  }, 30)
}

function skipTextAnimation() {
  if (!dialogue.value) return
  if (textAnimTimer.value) {
    clearInterval(textAnimTimer.value)
    textAnimTimer.value = null
  }
  displayText.value = dialogue.value.text
  textAnimating.value = false
}

function handleChoice(choice: StoryChoice) {
  if (textAnimating.value) {
    skipTextAnimation()
    return
  }
  
  const result = makeChoice(choice.id)
  if (result?.consequenceText) {
    consequenceText.value = result.consequenceText
  }
  if (result?.unlockedCodex) {
    const entry = unlockCodexEntry(result.unlockedCodex)
    if (entry) {
      emit('codexUnlock', entry)
    }
  }
  
  setTimeout(() => {
    if (!props.activeEvent) {
      emit('close')
    }
  }, 50)
}

function handleContinue() {
  if (textAnimating.value) {
    skipTextAnimation()
    return
  }
  
  if (dialogue.value?.autoReward) {
    emit('reward', dialogue.value.autoReward)
  }
  
  advanceDialogue()
  
  setTimeout(() => {
    if (!props.activeEvent) {
      emit('close')
    }
  }, 50)
}

function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    encounter: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    dialogue: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    mystery: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    blessing: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    trap: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)'
  }
  return colors[type] || colors.dialogue
}

function getTypeBadge(type: string): string {
  const badges: Record<string, string> = {
    encounter: '遭遇',
    dialogue: '对话',
    mystery: '神秘',
    blessing: '祝福',
    trap: '陷阱'
  }
  return badges[type] || '事件'
}
</script>

<template>
  <Transition name="story-fade">
    <div v-if="showing && event && dialogue" class="story-overlay" @click.self="handleContinue">
      <div class="story-container">
        <div class="story-header" :style="{ background: getEventTypeColor(event.type) }">
          <div class="event-type-badge">{{ getTypeBadge(event.type) }}</div>
          <div class="event-title">
            <span class="event-icon">{{ event.icon }}</span>
            <span class="event-name">{{ event.name }}</span>
          </div>
        </div>
        
        <div class="story-body">
          <div class="speaker-section">
            <div class="speaker-avatar">{{ dialogue.speakerAvatar || '👤' }}</div>
            <div class="speaker-name">{{ dialogue.speaker }}</div>
          </div>
          
          <div class="dialogue-box" @click="handleContinue">
            <p class="dialogue-text">{{ displayText }}<span v-if="textAnimating" class="cursor">|</span></p>
            
            <div v-if="consequenceText" class="consequence-text">
              <span class="consequence-icon">💫</span>
              {{ consequenceText }}
            </div>
            
            <div v-if="!textAnimating && !hasChoices" class="continue-hint">
              点击继续 ▶
            </div>
          </div>
          
          <div v-if="hasChoices && !textAnimating" class="choices-section">
            <button
              v-for="choice in dialogue.choices"
              :key="choice.id"
              class="choice-button"
              @click="handleChoice(choice)"
            >
              <span class="choice-text">{{ choice.text }}</span>
              <div v-if="choice.effects && choice.effects.length > 0" class="choice-effects">
                <span v-for="(eff, idx) in choice.effects" :key="idx" class="effect-tag">
                  {{ eff.description }}
                </span>
              </div>
              <div v-if="choice.rewards" class="choice-rewards">
                <span v-if="choice.rewards.coins" class="reward-tag">💰 +{{ choice.rewards.coins }}</span>
                <span v-if="choice.rewards.score" class="reward-tag">⭐ +{{ choice.rewards.score }}</span>
                <span v-if="choice.rewards.resources" class="reward-tag">
                  <span v-for="(amount, type) in choice.rewards.resources" :key="type">
                    {{ type === 'wood' ? '🪵' : type === 'stone' ? '🪨' : type === 'herb' ? '🌿' : type === 'crystal' ? '💎' : '🫐' }} +{{ amount }}
                  </span>
                </span>
              </div>
              <div v-if="choice.unlocksCodex" class="choice-codex">
                <span class="codex-tag">📖 解锁图鉴</span>
              </div>
            </button>
          </div>
        </div>
        
        <div class="story-footer">
          <div class="progress-dots">
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.story-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.story-container {
  width: 100%;
  max-width: 600px;
  background: linear-gradient(145deg, #2a1810 0%, #1a0f0a 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 3px rgba(255, 215, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.4);
}

.story-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.event-type-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  backdrop-filter: blur(4px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.event-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.event-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.story-body {
  padding: 20px;
}

.speaker-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.speaker-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 3px solid rgba(255, 215, 0, 0.5);
}

.speaker-name {
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.dialogue-box {
  background: linear-gradient(145deg, rgba(255, 248, 220, 0.95) 0%, rgba(255, 235, 180, 0.95) 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  position: relative;
  border: 2px solid rgba(139, 69, 19, 0.3);
  box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.5);
  transition: transform 0.1s;
}

.dialogue-box:hover {
  transform: translateY(-1px);
}

.dialogue-text {
  font-size: 16px;
  line-height: 1.7;
  color: #3d2914;
  margin: 0;
  min-height: 60px;
}

.cursor {
  animation: blink 0.8s infinite;
  font-weight: bold;
  color: #8B4513;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.consequence-text {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #fff9c4 0%, #fff176 100%);
  border-radius: 10px;
  font-size: 14px;
  color: #6d4c41;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 4px solid #FFD700;
  animation: slideInLeft 0.3s ease;
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.consequence-icon {
  font-size: 18px;
}

.continue-hint {
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 13px;
  color: #8B4513;
  opacity: 0.7;
  animation: pulse 1.5s infinite;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(3px); }
}

.choices-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-button {
  width: 100%;
  background: linear-gradient(145deg, #3e2723 0%, #5d4037 100%);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 14px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff8e1;
  position: relative;
  overflow: hidden;
}

.choice-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.choice-button:hover {
  border-color: #FFD700;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.choice-button:hover::before {
  left: 100%;
}

.choice-button:active {
  transform: translateY(0);
}

.choice-text {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  display: block;
  margin-bottom: 8px;
}

.choice-effects, .choice-rewards, .choice-codex {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.effect-tag, .reward-tag, .codex-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.effect-tag {
  background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%);
  color: #4a148c;
}

.reward-tag {
  background: linear-gradient(135deg, #fff9c4 0%, #ffee58 100%);
  color: #f57f17;
}

.codex-tag {
  background: linear-gradient(135deg, #b3e5fc 0%, #4fc3f7 100%);
  color: #01579b;
}

.story-footer {
  padding: 12px 20px;
  display: flex;
  justify-content: center;
  border-top: 1px solid rgba(255, 215, 0, 0.1);
}

.progress-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.dot.active {
  background: #FFD700;
  width: 24px;
  border-radius: 4px;
}

.story-fade-enter-active,
.story-fade-leave-active {
  transition: all 0.4s ease;
}

.story-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.story-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (max-width: 480px) {
  .story-overlay {
    padding: 12px;
  }
  
  .story-body {
    padding: 16px;
  }
  
  .dialogue-text {
    font-size: 15px;
  }
  
  .event-name {
    font-size: 16px;
  }
}
</style>
