<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import CustomDialog from './components/CustomDialog.vue'

interface Position {
  no: string | number
  name: string
  xMM: string
  yMM: string
}

type PositionList = Position[]

type JoyString = 'left' | 'top' | 'down' | 'right'

// State
const imageUploadRef = ref<HTMLInputElement | null>(null)
const selectedImage = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const positionList = ref<PositionList>([])
const newPostionListString = ref<string>()
const positionListString = computed(() => {
  if (!positionList.value || positionList.value.length === 0) {
    return ''
  }
  return JSON.stringify(positionList.value, null, 2)
})
const currentPosition = reactive({ x: '0', y: '0' })
const pageRef = ref<HTMLElement | null>(null)
const showTooltip = ref(false)
const tooltipPosition = reactive({ x: 0, y: 0 })
const rangeMin = 0
const rangeMax = 100
const rangeStep = 0.5

const a4WidthMm = 210
const a4HeightMm = 297

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
  if (!newPostionListString.value) {
    /* empty */
  }
  const newPostionListJson: PositionList = JSON.parse(
    newPostionListString.value || '',
  )
  if (Array.isArray(newPostionListJson)) {
    const template: PositionList = []
    newPostionListJson.forEach((pos) => {
      template.push({
        no: pos?.no || '',
        name: pos?.name || '',
        xMM: pos?.xMM || '',
        yMM: pos?.yMM || '',
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
// const joyHoldDuration = 200
function movePostionJoy(key: JoyString, currentPos: Position): void {
  switch (key) {
    case 'left':
      currentPos.xMM = `${Number(currentPos.xMM) - rangeStep}`
      break
    case 'top':
      currentPos.yMM = `${Number(currentPos.yMM) - rangeStep}`
      break
    case 'down':
      currentPos.yMM = `${Number(currentPos.yMM) + rangeStep}`
      break
    case 'right':
      currentPos.xMM = `${Number(currentPos.xMM) + rangeStep}`
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
  if (confirm('Are you sure to remove this position?') === false)
    return
  positionList.value = positionList.value.filter(
    (_, index) => index !== posIndex,
  )
}

function calculatePositionFromEvent(
  evt: MouseEvent,
): { xMM: string, yMM: string } | undefined {
  if (!pageRef.value || !selectedImage.value)
    return
  const pageWidth = pageRef.value.clientWidth
  const pageHeight = pageRef.value.clientHeight
  const rectPage = pageRef.value.getBoundingClientRect()
  const offsetX = evt.clientX - rectPage.left
  const offsetY = evt.clientY - rectPage.top
  // console.log({ offsetX, offsetY, pageWidth, pageHeight, rect })
  const fixedDecimal = 2
  // const xPercent = ((offsetX / pageWidth) * 100).toFixed(fixedDecimal)
  // const yPercent = ((offsetY / pageHeight) * 100).toFixed(fixedDecimal)
  const xMM = ((offsetX / pageWidth) * a4WidthMm).toFixed(fixedDecimal)
  const yMM = ((offsetY / pageHeight) * a4HeightMm).toFixed(fixedDecimal)
  return { xMM, yMM }
}

function copyPosition(text: string) {
  if (!text) {
    /* empty */
  }
  if (!navigator.clipboard) {
    /* not supported */
  }
  navigator.clipboard.writeText(text)
  alert('copy success!')
}

const onMouseMoveDebounce = debounce(onMouseMove, 200)

function onMouseMove(evt: MouseEvent): void {
  if (!pageRef.value || !selectedImage.value)
    return
  const { xMM, yMM } = calculatePositionFromEvent(evt) || {
    xMM: '0',
    yMM: '0',
  }
  currentPosition.x = xMM
  currentPosition.y = yMM
}

function onMouseOver(): void {
  if (!pageRef.value || !selectedImage.value)
    return
  showTooltip.value = true
}

function onMouseDown(evt: MouseEvent): void {
  evt.preventDefault()
  if (!pageRef.value || !selectedImage.value)
    return

  if (evt.button === 2) {
    return
  }

  const posName = prompt('Please enter the position name, or leave blank')
  if (posName === null) {
    return
  }
  const { xMM, yMM } = calculatePositionFromEvent(evt) || {
    xMM: '0',
    yMM: '0',
  }
  positionList.value.push({
    no: positionList.value.length + 1,
    name: posName || '',
    xMM,
    yMM,
  })
}

function onMouseOut(evt: MouseEvent): void {
  if ((evt.relatedTarget as HTMLElement)?.className === 'tooltip') {
    return
  }
  showTooltip.value = false
}

// function onContextmenu() {

// }

function calculateTooltipPosition(evt: MouseEvent): { x: number, y: number } {
  if (!pageRef.value || !selectedImage.value)
    return { x: 0, y: 0 }
  const offsetXY = 14
  // print all position event
  const x
    = evt.clientX + (document.scrollingElement?.scrollLeft || 0) + offsetXY
  const y
    = evt.clientY + (document.scrollingElement?.scrollTop || 0) + offsetXY
  return { x, y }
}

const isDraggingPoint = ref<boolean>(false)
const offsetPostion = ref<{ x: number, y: number }>({
  x: 0,
  y: 0,
})
const draggingPosition = ref<Position | null>(null)
const selecteElementPoint = ref<HTMLDivElement | null>(null)

function onMouseDownPoint(evt: MouseEvent, pos: Position): void {
  evt.stopPropagation()
  evt.preventDefault()
  const target = evt.target as HTMLDivElement
  selecteElementPoint.value = target
  isDraggingPoint.value = true
  offsetPostion.value.x = evt.clientX - target.getBoundingClientRect().left
  offsetPostion.value.y = evt.clientY - target.getBoundingClientRect().top
  draggingPosition.value = pos

  // Add global listeners
  document.addEventListener('mousemove', onGlobalMouseMove)
  document.addEventListener('mouseup', onGlobalMouseUp)
}

function onGlobalMouseMove(evt: MouseEvent): void {
  if (!isDraggingPoint.value || !draggingPosition.value)
    return
  if (!pageRef.value || !selectedImage.value)
    return

  evt.preventDefault()
  const { xMM, yMM } = calculatePositionBoxFromEvent(evt) || { xMM: '0', yMM: '0' }
  draggingPosition.value.xMM = xMM
  draggingPosition.value.yMM = yMM
}

function calculatePositionBoxFromEvent(
  evt: MouseEvent,
): { xMM: string, yMM: string } | undefined {
  if (!pageRef.value || !selectedImage.value)
    return
  const pageWidth = pageRef.value.clientWidth
  const pageHeight = pageRef.value.clientHeight
  const rectPage = pageRef.value.getBoundingClientRect()

  const offsetX = evt.clientX - rectPage.left - offsetPostion.value.x
  const offsetY = evt.clientY - rectPage.top - offsetPostion.value.y
  // console.log({ offsetX, offsetY, pageWidth, pageHeight, rect })
  const fixedDecimal = 2
  // const xPercent = ((offsetX / pageWidth) * 100).toFixed(fixedDecimal)
  // const yPercent = ((offsetY / pageHeight) * 100).toFixed(fixedDecimal)
  const xMM = ((offsetX / pageWidth) * a4WidthMm).toFixed(fixedDecimal)
  const yMM = ((offsetY / pageHeight) * a4HeightMm).toFixed(fixedDecimal)
  console.log(`Position: ${xMM}mm, ${yMM}mm`)
  return { xMM, yMM }
}

function onGlobalMouseUp(): void {
  isDraggingPoint.value = false
  offsetPostion.value = { x: 0, y: 0 }

  // Clean up global listeners
  document.removeEventListener('mousemove', onGlobalMouseMove)
  document.removeEventListener('mouseup', onGlobalMouseUp)
}

function windowsMouseMove(evt: MouseEvent): void {
  const { x, y } = calculateTooltipPosition(evt)
  tooltipPosition.x = x
  tooltipPosition.y = y
}

onMounted(() => {
  if (pageRef?.value) {
    pageRef.value.addEventListener('mousemove', windowsMouseMove)
  }
})

onUnmounted(() => {
  if (pageRef?.value) {
    pageRef.value.removeEventListener('mousemove', windowsMouseMove)
  }
})
</script>

<template>
  <div class="app">
    <h1 class="title noprint">
      <span>A4</span> Document Position Editor.
    </h1>
    <div class="noprint">
      <ol>
        <li>Upload A4 image (.png, .jpg).</li>
        <li>Upload Position or create new by click on image.</li>
        <li>Drag to move point.</li>
        <li>or Use joystick or input to adjust position.</li>
        <li>Copy JSON position list.</li>
      </ol>
    </div>
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
        @contextmenu.prevent
      >
        <div
          v-for="pos in positionList"
          :key="pos.no"
          class="point"
          :style="{ left: `${pos.xMM}mm`, top: `${pos.yMM}mm` }"
          :class="[isDraggingPoint && draggingPosition?.no === pos.no ? 'is-draging' : '']"
          :title="`(${pos.xMM}mm, ${pos.yMM}mm)`"
          @mousedown="onMouseDownPoint($event, pos)"
        >
          {{ pos.no }} {{ pos?.name }}
        </div>
      </div>
      <div v-show="showTooltip" class="tooltip" :style="tooltipPositionStyle">
        ({{ currentPosition.x }}mm, {{ currentPosition.y }}mm)
      </div>
      <div class="card-wrapper noprint">
        <div class="label-wrapper">
          <div class="label noprint">
            POSITION LIST
          </div>
          <button class="button" :disabled="!selectedImage" @click="showDialog">
            IMPORT POSITIONS
          </button>
          <button class="button reset-label-btn" :disabled="positionList.length <= 0" @click="resetPositionList">
            RESET POSITION LIST
          </button>
        </div>
        <div class="card-header">
          <div>No</div>
          <div>Name</div>
          <div>X(mm)</div>
          <div>Y(mm)</div>
          <div>Joypad</div>
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
                v-model="card.xMM"
                type="number"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
              <input
                v-model="card.xMM"
                type="range"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
            </div>
            <div class="card-input">
              <input
                v-model="card.yMM"
                type="number"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
              <input
                v-model="card.yMM"
                type="range"
                :min="rangeMin"
                :max="rangeMax"
                :step="rangeStep"
              >
            </div>
            <div class="joystick">
              <button
                @mousedown="movePostionJoy('left', card)"
                @mouseup="clearHoldJoy"
                @mouseout="clearHoldJoy"
              >
                <svg
                  name="arrow-left"
                  role="button"
                  style="transform: rotate(270deg)"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19"
                  />
                </svg>
              </button>
              <div class="middle">
                <button
                  @mousedown="movePostionJoy('top', card)"
                  @mouseup="clearHoldJoy"
                  @mouseout="clearHoldJoy"
                >
                  <svg
                    name="arrow-top"
                    role="button"
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19"
                    />
                  </svg>
                </button>
                <div class="ball" />
                <button
                  @mousedown="movePostionJoy('down', card)"
                  @mouseup="clearHoldJoy"
                  @mouseout="clearHoldJoy"
                >
                  <svg
                    name="arrow-down"
                    role="button"
                    style="transform: rotate(180deg)"
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19"
                    />
                  </svg>
                </button>
              </div>
              <button
                @mousedown="movePostionJoy('right', card)"
                @mouseup="clearHoldJoy"
                @mouseout="clearHoldJoy"
              >
                <svg
                  name="arrow-right"
                  role="button"
                  style="transform: rotate(90deg)"
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19"
                  />
                </svg>
              </button>
            </div>
            <button
              class="card-remove button"
              @click="removePosition(cardIndex)"
            >
              X
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="label-wrapper noprint">
      <div class="label">
        <div>JSON</div>
      </div>
      <button
        class="button icon"
        :disabled="!positionListString"
        @click="copyPosition(positionListString)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="M3 3a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H5v12a1 1 0 1 1-2 0zm4 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v12a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z"
            clip-rule="evenodd"
          />
        </svg>
        Copy
      </button>
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
    <CustomDialog
      ref="dialog"
      :is-confirm-auto-close="false"
      @confirm="confirmNewPostionList"
    >
      <div class="label noprint">
        Position list in JSON
      </div>
      <textarea
        id="newPostionList"
        v-model="newPostionListString"
        name="newPostionList"
        cols="100"
        rows="20"
        class="noprint"
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
  background: transparent;
  padding: 1rem;
}

.title {
  text-align: center;
  margin-top: 1rem;

  & span {
    font-weight: bold;
    color: var(--primary-color);
  }
}

.label-wrapper {
  display: flex;
  gap: 1rem;
}

.label {
  width: fit-content;
  background-color: black;
  color: white;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.5rem 0.5rem 0 0;
  align-content: center;
  height: 32px;
}

.btn-copy {
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
  border: solid 1px;
  margin: 1rem auto;
  border-style: dashed;
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
  cursor: grab;
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
  padding-right: 0.5rem;

  & .card-header {
    display: grid;
    grid-template-columns:
      var(--w-col1) var(--w-col2) var(--w-col3) var(--w-col4)
      var(--w-col5) var(--w-col6);
    grid-template-rows: 1fr;
    justify-content: center;
    text-align: center;
    background: var(--primary-color);
    font-size: 1rem;
    height: 40px;
    max-width: var(--w-max-width);
    gap: var(--row-gap);
    color: white;
    text-transform: capitalize;

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
    background: #c6c9ff;
    height: 60dvh;
    width: var(--w-max-width);
    border-radius: 0 0 0.5rem 0.5rem;
    /* box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.5); */

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
    height: 8px;
    width: 8px;
    background-color: #fff;
    border-radius: 50%;
  }
}

.is-draging {
  background-color: blue !important;
  cursor: grabbing;
}

@media screen and (max-width: 1200px) {
  .main {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr;
  }
}
</style>
