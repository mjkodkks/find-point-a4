<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import CustomDialog from './components/CustomDialog.vue'

interface Position {
  no: string | number
  name: string
  xPercent: string
  yPercent: string
}

type PositionList = Position[]

type JoyString = 'left' | 'top' | 'down' | 'right'

// State
const imageUploadRef = ref<HTMLInputElement | null>(null)
const selectedImage = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const positionList = ref<PositionList>([])
const newPostionListString = ref<string>()
const positionListString = computed(() => JSON.stringify(positionList.value, null, 2))
const currentPosition = reactive({ x: '0', y: '0' })
const pageRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)
const tooltipPosition = reactive({ x: 0, y: 0 })
const rangeMin = 0
const rangeMax = 100
const rangeStep = 0.5

// Computed
const styleComputed = computed(() => ({
  background: previewUrl.value ? `url(${previewUrl.value}) no-repeat` : '#fff',
  backgroundSize: 'contain',
}))

const tooltipPositionStyle = computed(() => ({
  transform: `translate(${tooltipPosition.x}px, ${tooltipPosition.y}px)`,
}))

// Methods
function uploadChange(evt: Event): void {
  const el = evt.target as HTMLInputElement | null
  const file = el?.files ? el.files[0] : null
  if (!file)
    return
  selectedImage.value = file
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    previewUrl.value = reader.result as string
  })
  reader.readAsDataURL(file)
}

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

const dialog = ref<InstanceType<typeof CustomDialog>>()

function showDialog(): void {
  if (dialog.value) {
    dialog.value.showDialog()
  }
}

function confirmNewPostionList(): void {
  if (!newPostionListString.value) { /* empty */ }
  const newPostionListJson: PositionList = JSON.parse(newPostionListString.value || '')
  if (Array.isArray(newPostionListJson)) {
    const template: PositionList = []
    newPostionListJson.forEach((pos) => {
      template.push({
        no: pos?.no || '',
        name: pos?.name || '',
        xPercent: pos?.xPercent || '',
        yPercent: pos?.yPercent || '',
      })
    })
    positionList.value = template
  }
  newPostionListString.value = ''
  if (dialog.value) {
    dialog.value.close()
  }
}

const joyClickInterval = ref<number | null>(null)
const joyHoldDuration = 200
function movePostionJoy(key: JoyString, currentPos: Position): void {
  switch (key) {
    case 'left':
      currentPos.xPercent = `${Number(currentPos.xPercent) - rangeStep}`
      break
    case 'top':
      currentPos.yPercent = `${Number(currentPos.yPercent) - rangeStep}`
      break
    case 'down':
      currentPos.yPercent = `${Number(currentPos.yPercent) + rangeStep}`
      break
    case 'right':
      currentPos.xPercent = `${Number(currentPos.xPercent) + rangeStep}`
  }
}

function clearHoldJoy() {
  joyClickInterval.value && clearTimeout(joyClickInterval.value)
}
function reset(): void {
  selectedImage.value = null
  previewUrl.value = null
  if (imageUploadRef.value) {
    imageUploadRef.value.value = ''
  }
  positionList.value = []
  showTooltip.value = false
  newPostionListString.value = ''
}

function resetPositionList(): void {
  positionList.value = []
}

function removePosition(posIndex: number): void {
  positionList.value = positionList.value.filter(
    (_, index) => index !== posIndex,
  )
}

function calculatePercentFromEvent(
  evt: MouseEvent,
): { xPercent: string, yPercent: string } | undefined {
  if (!pageRef.value || !selectedImage.value)
    return
  const pageWidth = pageRef.value.clientWidth
  const pageHeight = pageRef.value.clientHeight
  const rect = pageRef.value.getBoundingClientRect()
  const x = evt.clientX - rect.left
  const y = evt.clientY - rect.top
  const fixedDecimal = 2
  const xPercent = ((x / pageWidth) * 100).toFixed(fixedDecimal)
  const yPercent = ((y / pageHeight) * 100).toFixed(fixedDecimal)
  return { xPercent, yPercent }
}

const onMouseMoveDebounce = debounce(onMouseMove, 100)

function onMouseMove(evt: MouseEvent): void {
  if (!pageRef.value || !selectedImage.value)
    return
  const { xPercent, yPercent } = calculatePercentFromEvent(evt) || {
    xPercent: '0',
    yPercent: '0',
  }
  currentPosition.x = xPercent
  currentPosition.y = yPercent
}

function onMouseOver(): void {
  if (!pageRef.value || !selectedImage.value)
    return
  showTooltip.value = true
}

function onMouseDown(evt: MouseEvent): void {
  if (!pageRef.value || !selectedImage.value)
    return

  const posName = prompt('Please enter the position name, or leave blank')
  const { xPercent, yPercent } = calculatePercentFromEvent(evt) || {
    xPercent: '0',
    yPercent: '0',
  }
  positionList.value.push({
    no: positionList.value.length + 1,
    name: posName || '',
    xPercent,
    yPercent,
  })
}

function onMouseOut(evt: MouseEvent): void {
  if ((evt.relatedTarget as HTMLElement)?.className === 'tooltip') {
    return
  }
  showTooltip.value = false
}

function calculateTooltipPosition(evt: MouseEvent): { x: number, y: number } {
  if (!pageRef.value || !selectedImage.value)
    return { x: 0, y: 0 }
  const offsetXY = 14
  const x
    = evt.clientX + (document.scrollingElement?.scrollLeft || 0) + offsetXY
  const y
    = evt.clientY + (document.scrollingElement?.scrollTop || 0) + offsetXY
  return { x, y }
}

function windowsMouseMove(evt: MouseEvent): void {
  const { x, y } = calculateTooltipPosition(evt)
  tooltipPosition.x = x
  tooltipPosition.y = y
}

onMounted(() => {
  document.addEventListener('mousemove', windowsMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', windowsMouseMove)
})
</script>

<template>
  <div class="app">
    <h1 class="title noprint">
      Find point in A4 coordinate system as a percent(%)
    </h1>
    <div class="action-wrapper noprint">
      <div class="fileupload-wrapper noprint">
        <input
          id="image_uploads"
          ref="imageUploadRef"
          type="file"
          name="image_uploads"
          class="input-upload"
          accept="image/*"
          @change="uploadChange"
        >
      </div>
      <button v-if="selectedImage" class="button reset-btn" @click="reset">
        RESET
      </button>
      <div v-if="positionList.length > 0" class="reset-label-btn">
        <button class="button" @click="resetPositionList">
          RESET LABEL
        </button>
      </div>
      <div v-if="selectedImage">
        <button class="button" @click="showDialog">
          IMPORT POSITIONS
        </button>
      </div>
    </div>
    <div class="main">
      <div
        ref="pageRef"
        class="page a4"
        :style="styleComputed"
        @mousemove="onMouseMoveDebounce"
        @mousedown="onMouseDown"
        @mouseout="onMouseOut"
        @mouseover="onMouseOver"
      >
        <div
          v-for="pos in positionList"
          :key="pos.no"
          class="point"
          :style="{ left: `${pos.xPercent}%`, top: `${pos.yPercent}%` }"
        >
          {{ pos.no }} {{ pos?.name }}
        </div>
      </div>
      <div v-show="showTooltip" class="tooltip" :style="tooltipPositionStyle">
        ({{ currentPosition.x }}%, {{ currentPosition.y }}%)
      </div>
      <div class="card-wrapper noprint">
        <div class="label noprint">
          POSITION LIST
        </div>
        <div class="card-header">
          <div>No</div>
          <div>Name</div>
          <div>X%</div>
          <div>Y%</div>
          <div>joypad</div>
          <div />
        </div>
        <div class="card-list">
          <div
            v-for="(card, cardIndex) in positionList"
            :key="card.no"
            class="card"
          >
            <div class="card-no">
              {{ card.no }}
            </div>
            <div class="card-name">
              <input v-model="card.name" type="text">
            </div>
            <div class="card-input">
              <input
                v-model="card.xPercent"
                type="number"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
              <input
                v-model="card.xPercent"
                type="range"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
            </div>
            <div class="card-input">
              <input
                v-model="card.yPercent"
                type="number"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
              <input
                v-model="card.yPercent"
                type="range"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
            </div>
            <div class="joystick">
              <button @mousedown="movePostionJoy('left', card)" @mouseup="clearHoldJoy" @mouseout="clearHoldJoy">
                <svg name="arrow-left" role="button" style="transform: rotate(270deg);" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19" />
                </svg>
              </button>
              <div class="middle">
                <button @mousedown="movePostionJoy('top', card)" @mouseup="clearHoldJoy" @mouseout="clearHoldJoy">
                  <svg name="arrow-top" role="button" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19" />
                  </svg>
                </button>
                <div class="ball" />
                <button @mousedown="movePostionJoy('down', card)" @mouseup="clearHoldJoy" @mouseout="clearHoldJoy">
                  <svg name="arrow-down" role="button" style="transform: rotate(180deg);" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19" />
                  </svg>
                </button>
              </div>
              <button @mousedown="movePostionJoy('right', card)" @mouseup="clearHoldJoy" @mouseout="clearHoldJoy">
                <svg name="arrow-right" role="button" style="transform: rotate(90deg);" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19" />
                </svg>
              </button>
            </div>
            <button class="card-remove button" @click="removePosition(cardIndex)">
              X
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="label noprint">
      JSON
    </div>
    <textarea
      id="json-list"
      v-model="positionListString"
      name="json-list"
      cols="30"
      rows="10"
      class="noprint"
      style="width: 100%"
    />
    <CustomDialog ref="dialog" :is-confirm-auto-close="false" @confirm="confirmNewPostionList">
      <textarea
        id="newPostionList" v-model="newPostionListString"
        name="newPostionList"
        cols="30" rows="10" class="noprint"
        style="width: 100%"
      />
    </CustomDialog>
  </div>
</template>

<style scoped>
.main {
  display: grid;
  grid-template-columns: 3fr 2fr;
  grid-template-rows: 1fr;
}

.title {
  text-align: center;
}

.label {
  width: fit-content;
  background-color: black;
  color: white;
  padding: 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  border-radius: 0.5rem 0.5rem 0 0;
}

.fileupload-wrapper {
  display: flex;
  justify-content: center;
  margin: 1rem;
}

.tooltip {
  width: 160px;
  background-color: #000000a6;
  color: #fff;
  text-align: center;
  padding: 5px 4px;
  border-radius: 6px;
  min-height: 24px;
  position: absolute;
  left: 0;
  top: 0;
  transition: all 0.2s;
}

.action-wrapper {
  display: flex;
  gap: 1rem;
  justify-content: center;
  min-height: 1.25rem;
  align-items: center;
}

.reset-label-btn {
  display: flex;
}

.point {
  min-width: 20px;
  padding: 2px;
  height: 20px;
  font-size: 0.75rem;
  text-align: center;
  background: red;
  position: absolute;
  color: #fff;
  border-radius: 0.2rem;
}

.card-wrapper {
  --w-col1: 60px;
  --w-col2: 1fr;
  --w-col3: 60px;
  --w-col4: 60px;
  --w-col5: 60px;
  --w-col6: 60px;
  --w-max-width: 100%;
  --row-gap: 0.5rem;
  color: #fff;
  padding-right: 0.5rem;
  & .card-header {
    display: grid;
    grid-template-columns:
      var(--w-col1) var(--w-col2) var(--w-col3) var(--w-col4) var(--w-col5) var(--w-col6);
    grid-template-rows: 1fr;
    justify-content: center;
    text-align: center;
    background: black;
    color: white;
    font-size: 1rem;
    height: 40px;
    max-width: var(--w-max-width);
    gap: var(--row-gap);
    & div {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  & .card-list {
    --height: 46px;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    overflow: auto;
    resize: vertical;
    padding: 0.5rem 0;
    max-width: var(--w-max-width);
    background: rgb(44, 44, 44);
    height: 60dvh;
    width: var(--w-max-width);
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.5);
    & .card {
      min-height: var(--height);
      display: grid;
      grid-template-columns:
        var(--w-col1) var(--w-col2) var(--w-col3) var(--w-col4)
        var(--w-col5) var(--w-col6);
      grid-template-rows: 1fr;
      gap: var(--row-gap);
      justify-content: center;
      align-items: flex-start;
    }
    & .card-no {
      text-align: center;
    }
    & .card-name {
      & input {
        width: 100%;
      }
    }
    & .card-input {
      display: flex;
      flex-direction: column;
    }
    & .card-remove {
      width: 40px;
      cursor: pointer;
    }
  }
}

.joystick {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  align-items: center;
  align-self: center;
  justify-items: center;
  & svg {
    cursor: pointer;
    transition: all 0.3s;
    &:hover {
      color: red;
    }
  }
  & .middle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  & .ball {
    height: 8px; width: 8px; background-color: #fff; border-radius: 50%;
  }
}

@media screen and (max-width: 1200px) {
  .main {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr;
  }
}
</style>
