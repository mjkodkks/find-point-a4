<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  isConfirmAutoClose: {
    type: Boolean,
    default: true,
  },
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  hideConfirm: {
    type: Boolean,
    default: false,
  },
  hideCancel: {
    type: Boolean,
    default: false,
  },
  classes: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['confirm', 'cancel'])
const dialog = ref<HTMLDialogElement>()

function cancel() {
  dialog.value?.close()
  emit('cancel')
}

function confirm() {
  if (props.isConfirmAutoClose) {
    dialog.value?.close()
  }
  emit('confirm')
}

const visible = ref(false)

function showDialog() {
  dialog.value?.showModal()
  visible.value = true
}

defineExpose({
  showDialog,
  close: (returnVal?: string): void => dialog.value?.close(returnVal),
  visible,
})
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog dialog-bottom sm:dialog-middle"
    @close="visible = false"
  >
    <form
      v-if="visible"
      method="dialog"
      class="mdialogodal-box rounded-none p-4" :class="{
        [props.classes]: props.classes,
      }"
    >
      <slot />

      <div v-if="!props.hideConfirm || !props.hideCancel" class="modal-action">
        <slot name="actionButtons">
          <button
            v-if="!props.hideCancel"
            value="false"
            class="btn btn-cancel button"
            @click.prevent="cancel"
          >
            {{ props.cancelText }}
          </button>
          <button
            v-if="!props.hideConfirm"
            value="true"
            class="btn btn-confirm button"
            @click.prevent="confirm"
          >
            {{ props.confirmText }}
          </button>
        </slot>
      </div>
      <slot name="footer" />
    </form>
  </dialog>
</template>

<style scoped>
@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog {
  background: #fff;
  border-color: none;
  border-radius: 8px;
  animation: contentShow 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  margin: 0 auto;
  min-width: 400px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.85);
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-action {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.btn-cancel {
    cursor: pointer;
  transition: all 0.3s ease;
}

.btn-confirm {
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover, .btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
