<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, computed } from 'vue';

const imageUploadRef = ref(null);
const selectedImage = ref(null);
const previewUrl = ref(null);
const styleComputed = computed(() => {
  return {
    background: previewUrl.value
      ? `url(${previewUrl.value}) no-repeat`
      : '#fff',
    backgroundSize: 'contain',
  };
});

function uploadChange(evt) {
  console.log(evt);
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  selectedImage.value = file;
  const reader = new FileReader();
  reader.addEventListener(
    'load',
    () => {
      // convert image file to base64 string
      previewUrl.value = reader.result;
    },
    false
  );

  if (file) {
    reader.readAsDataURL(file);
  }
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

function reset() {
  selectedImage.value = null;
  previewUrl.value = null;
  if (imageUploadRef.value) {
    imageUploadRef.value.value = '';
  }
  positionList.value = [];
  showTooltip.value = false;
}

const pageRef = ref(null);
const positionList = ref([]);
const currentPosition = reactive({ x: 0, y: 0 });

function calculatePercentFromEvent(evt) {
  if (!pageRef.value || !selectedImage.value) return;
  let pageWidth = pageRef.value.clientWidth;
  let pageHeight = pageRef.value.clientHeight;
  // console.log(evt)
  const rect = pageRef.value.getBoundingClientRect();
  const x = evt.clientX - rect.left; // Get mouse X coordinate relative to the image
  const y = evt.clientY - rect.top; // Get mouse Y coordinate relative to the image

  const fixedDecimal = 2;
  const xPercent = ((x / pageWidth) * 100).toFixed(fixedDecimal);
  const yPercent = ((y / pageHeight) * 100).toFixed(fixedDecimal);
  return { xPercent, yPercent };
}

const onMouseMoveDebounce = debounce(onMouseMove, 100);

function onMouseMove(evt) {
  if (!pageRef.value || !selectedImage.value) return;
  const { xPercent, yPercent } = calculatePercentFromEvent(evt);
  currentPosition.x = xPercent;
  currentPosition.y = yPercent;
  console.log(xPercent + '%', yPercent + '%');
}

function onMouseOver(evt) {
  if (!pageRef.value || !selectedImage.value) return;
  showTooltip.value = true;
}

function onMouseDown(evt) {
  console.log(evt);
  const { xPercent, yPercent } = calculatePercentFromEvent(evt);

  // push to list
  positionList.value = [
    ...positionList.value,
    {
      name: positionList.value.length + 1,
      xPercent,
      yPercent,
    },
  ];
}

function onMouseOut(evt) {
  if (evt.toElement.className === 'tooltip') {
    return;
  }
  showTooltip.value = false;
}

const showTooltip = ref(false);
const tooltipPostion = reactive({ x: 0, y: 0 });
const tooltipPositionStyle = computed(() => {
  return {
    transform: `translate(${tooltipPostion.x || 0}px, ${
      tooltipPostion.y || 0
    }px)`,
  };
});

function calculateTooltipPosition(evt) {
  let x,
    y = 0;
  if (!pageRef.value || !selectedImage.value) return { x, y };
  x = evt.clientX;
  y = evt.clientY + document.scrollingElement.scrollTop;
  return { x, y };
}

function windowsMouseMove(evt) {
  const { x, y } = calculateTooltipPosition(evt);
  tooltipPostion.x = x;
  tooltipPostion.y = y;
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
    <h1 class="title noprint">
      Find point in A4 coordinate system as a percent(%)
    </h1>
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
      <li v-for="pos in positionList">{{ pos }}</li>
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
