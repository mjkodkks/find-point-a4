<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, computed } from 'vue';

// State
const imageUploadRef = ref<HTMLInputElement | null>(null);
const selectedImage = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const positionList = ref<Array<{ name: number; xPercent: string; yPercent: string }>>([]);
const currentPosition = reactive({ x: '0', y: '0' });
const pageRef = ref<HTMLElement | null>(null);
const showTooltip = ref(false);
const tooltipPosition = reactive({ x: 0, y: 0 });

// Computed
const styleComputed = computed(() => ({
  background: previewUrl.value ? `url(${previewUrl.value}) no-repeat` : '#fff',
  backgroundSize: 'contain',
}));

const tooltipPositionStyle = computed(() => ({
  transform: `translate(${tooltipPosition.x}px, ${tooltipPosition.y}px)`,
}));

// Methods
function uploadChange(evt: Event): void {
  const el = evt.target as HTMLInputElement | null;
  const file = el?.files ? el.files[0] : null;
  if (!file) return;
  selectedImage.value = file;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    previewUrl.value = reader.result as string;
  });
  reader.readAsDataURL(file);
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function reset(): void {
  selectedImage.value = null;
  previewUrl.value = null;
  if (imageUploadRef.value) {
    imageUploadRef.value.value = '';
  }
  positionList.value = [];
  showTooltip.value = false;
}

function calculatePercentFromEvent(evt: MouseEvent): { xPercent: string; yPercent: string } | undefined {
  if (!pageRef.value || !selectedImage.value) return;
  const pageWidth = pageRef.value.clientWidth;
  const pageHeight = pageRef.value.clientHeight;
  const rect = pageRef.value.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  const y = evt.clientY - rect.top;
  const fixedDecimal = 2;
  const xPercent = ((x / pageWidth) * 100).toFixed(fixedDecimal);
  const yPercent = ((y / pageHeight) * 100).toFixed(fixedDecimal);
  return { xPercent, yPercent };
}

const onMouseMoveDebounce = debounce(onMouseMove, 100);

function onMouseMove(evt: MouseEvent): void {
  if (!pageRef.value || !selectedImage.value) return;
  const { xPercent, yPercent } = calculatePercentFromEvent(evt) || { xPercent: '0', yPercent: '0' };
  currentPosition.x = xPercent;
  currentPosition.y = yPercent;
}

function onMouseOver(): void {
  if (!pageRef.value || !selectedImage.value) return;
  showTooltip.value = true;
}

function onMouseDown(evt: MouseEvent): void {
  const { xPercent, yPercent } = calculatePercentFromEvent(evt) || { xPercent: '0', yPercent: '0' };
  positionList.value.push({
    name: positionList.value.length + 1,
    xPercent,
    yPercent,
  });
}

function onMouseOut(evt: MouseEvent): void {
  if ((evt.relatedTarget as HTMLElement)?.className === 'tooltip') {
    return;
  }
  showTooltip.value = false;
}

function calculateTooltipPosition(evt: MouseEvent): { x: number; y: number } {
  const x = evt.clientX;
  const y = evt.clientY + (document.scrollingElement?.scrollTop || 0);
  return { x, y };
}

function windowsMouseMove(evt: MouseEvent): void {
  const { x, y } = calculateTooltipPosition(evt);
  tooltipPosition.x = x;
  tooltipPosition.y = y;
}

onMounted(() => {
  document.addEventListener('mousemove', windowsMouseMove);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', windowsMouseMove);
});
</script>

<template>
  <div class="main">
    <h1 class="title noprint">Find point in A4 coordinate system as a percent(%)</h1>
    <div class="fileupload-wrapper noprint">
      <input
        type="file"
        id="image_uploads"
        ref="imageUploadRef"
        name="image_uploads"
        class="input-upload"
        accept=".jpg, .jpeg, .png"
        @change="uploadChange"
      />
      <button v-if="selectedImage" @click="reset">reset</button>
    </div>
    <div
      class="page a4"
      ref="pageRef"
      @mousemove="onMouseMoveDebounce"
      @mousedown="onMouseDown"
      @mouseout="onMouseOut"
      @mouseover="onMouseOver"
      :style="styleComputed"
    ></div>
    <div v-show="showTooltip" class="tooltip" :style="tooltipPositionStyle">
      ({{ currentPosition.x }}%, {{ currentPosition.y }}%)
    </div>
    <ul class="noprint">
      <li v-for="pos in positionList" :key="pos.name">{{ pos }}</li>
    </ul>
  </div>
</template>

<style scoped>
.title {
  text-align: center;
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
</style>
