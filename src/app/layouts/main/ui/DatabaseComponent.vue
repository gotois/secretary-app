<template>
  <div>
    <QForm
      greedy
      @submit="onImportDB"
    >
      <QFile
        v-model="file"
        accept=".json,.zip"
        :label="$t('settings.native.import')"
        :max-file-size="1024 * 1024 * 1024 * 2"
        filled
        outlined
        square
        color="accent"
        class="col"
        :dense="$q.platform.is.desktop"
        @update:model-value="onFileSelected"
        @rejected="onRejectedEntries"
      >
        <QTooltip>
          {{ $t('database.fileSize') }}
        </QTooltip>
        <template #prepend>
          <QIcon
            name="attach_file"
            @click.stop.prevent
          />
        </template>
      </QFile>
      <QBtn
        v-if="file"
        :label="$t('settings.native.submit')"
        type="submit"
        icon="file_upload"
        color="secondary"
        outline
        ripple
        square
        stretch
        :dense="$q.platform.is.desktop"
        class="full-width"
      >
        <QTooltip>
          {{ $t('database.fileImport') }}
        </QTooltip>
      </QBtn>
    </QForm>
    <QBtn
      v-if="contractsCount > 0"
      color="secondary"
      icon="file_download"
      :label="$t('settings.native.export')"
      class="full-width q-mt-md"
      ripple
      square
      stretch
      :dense="$q.platform.is.desktop"
      @click="onExportDB"
    >
      <QTooltip>
        {{ $t('database.fileExport') }}
      </QTooltip>
    </QBtn>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useQuasar,
  QBtn,
  QIcon,
  QForm,
  QFile,
  QTooltip,
  exportFile,
} from 'quasar'
import { exportDB, importInto } from 'dexie-export-import'
import useContractStore from '@/entities/contract'
import { db } from '@/shared/lib/databaseService'
import { getContent, generate } from '@/shared/lib/zipHelper'
import { useModal } from '@/shared/lib/useModal'

const $t = useI18n().t
const $q = useQuasar()
const modal = useModal()
const contractStore = useContractStore()

const file = ref<File>()
const contractsCount = computed(() => contractStore.contracts.length)

async function onFileSelected() {
  const confirmed = await modal.confirm(
    [
      $t('components.database.fileImportDialog.title'),
      $t('components.database.fileImportDialog.message'),
    ].join('\n'),
  )
  if (confirmed) {
    await onImportDB()
  }
}

function onRejectedEntries() {
  $q.notify({
    type: 'error',
    color: 'negative',
    message: $t('components.database.fileRejected'),
  })
}

function progressCallback({
  totalRows,
  completedRows,
}: {
  totalRows: number
  completedRows: number
}): boolean {
  if (completedRows === totalRows) {
    $q.loading.hide()
    return true
  }
  return false
}

async function onImportDB() {
  $q.loading.show()
  try {
    const content = await getContent(file.value)
    await importInto(db, content, {
      noTransaction: true,
      acceptChangedPrimaryKey: true,
      acceptVersionDiff: true,
      overwriteValues: true,
      clearTablesBeforeImport: false,
    })
    $q.localStorage.removeItem('contractNames')
    window.location.reload()
  } catch (error) {
    console.error(error)
    $q.loading.hide()
    $q.notify({
      message: $t('components.database.fileImportDialog.fail'),
      type: 'negative',
    })
  }
}

function onExportDB() {
  const dialog = $q.dialog({
    title: $t('components.database.fileExportDialog.title'),
    message: $t('components.database.fileExportDialog.prompt'),
    prompt: {
      model: '',
      isValid: (val) => val.length > 2,
      type: 'text',
    },
    cancel: true,
    persistent: false,
  })

  dialog.onOk(async (exportName: string) => {
    const status = await databaseExport(exportName)
    if (status) {
      $q.notify({
        type: 'positive',
        message: $t('components.database.fileExportDialog.success'),
      })
    } else {
      $q.notify({
        type: 'error',
        color: 'negative',
        message: $t('components.database.fileExportDialog.fail'),
      })
    }
  })
}

async function databaseExport(exportName: string) {
  if (!exportName) {
    return
  }
  const dialog = $q.dialog({
    message: $t('components.database.fileExportDialog.message'),
    progress: true,
    persistent: true,
    ok: false,
  })
  const blob = await exportDB(db, {
    prettyJson: false,
    progressCallback,
  })
  const content = await generate(blob, (metadata) => {
    const percentage = metadata.percent
    dialog.update({
      message: $t('components.database.fileExportDialog.progress', {
        percentage,
      }),
    })
    if (percentage === 100 && metadata.currentFile !== null) {
      dialog.hide()
    }
  })
  const filename = exportName.replace(/\.zip$/, '') + '.zip'

  return exportFile(filename, content)
}
</script>
