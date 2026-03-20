# Task: Implementar Strategy de Merge para Sync Cloud

## Metadata

- **Prioridade:** HIGH
- **Complexidade:** Muito Alta
- **Tempo Estimado:** 8-10 horas
- **Arquivos Envolvidos:**
  - `src/lib/cloud/sync.js`
  - `src/lib/db.js`
  - `src/lib/cloud/mergeStrategies.js` (criar)

## Problema Identificado

Sync atual faz "full replace" - se cloud tem dados mais novos, substitui local. Não há estratégia de merge para conflitos.

## Solução

Implementar sistema de merge com timestamps e estratégia last-write-wins com fallback manual para conflitos críticos.

## Arquitetura Proposta

### 1. Criar mergeStrategies.js

```javascript
// src/lib/cloud/mergeStrategies.js

export const MergeStrategy = {
  LAST_WRITE_WINS: "last_write_wins",
  LOCAL_PRESERVE: "local_preserve",
  CLOUD_PRESERVE: "cloud_preserve",
  MANUAL: "manual",
};

export function createMergeContext(localData, cloudData) {
  return {
    local: localData,
    cloud: cloudData,
    conflicts: [],
    resolved: [],
  };
}

export function resolveMerge(ctx) {
  const results = [];

  for (const cloudItem of ctx.cloud) {
    const localItem = ctx.local.find((l) => l.id === cloudItem.id);

    if (!localItem) {
      results.push({ ...cloudItem, _source: "cloud" });
      continue;
    }

    const localTime = new Date(
      localItem.updatedAt || localItem.createdAt,
    ).getTime();
    const cloudTime = new Date(
      cloudItem.updatedAt || cloudItem.createdAt,
    ).getTime();

    if (cloudTime > localTime) {
      results.push({ ...cloudItem, _source: "cloud" });
    } else {
      results.push({ ...localItem, _source: "local" });
    }
  }

  // Itens só no local
  for (const localItem of ctx.local) {
    if (!ctx.cloud.find((c) => c.id === localItem.id)) {
      results.push({ ...localItem, _source: "local" });
    }
  }

  return results;
}
```

### 2. Atualizar sync.js

```javascript
import {
  createMergeContext,
  resolveMerge,
  MergeStrategy,
} from "./mergeStrategies.js";

async function restoreFromCloudIfNeeded(force = false) {
  const localHasData = (await db.config.count()) > 0;

  if (localHasData && !force) return;

  const { data: cloudSnapshot, error } = await supabase
    .from("study_snapshots")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!cloudSnapshot || error) return;

  // IMPORTANTE: Fazer merge, não replace
  const localData = await collectLocalSnapshot();
  const cloudData = JSON.parse(cloudSnapshot.data);

  for (const table of TABLES) {
    const ctx = createMergeContext(
      localData[table] || [],
      cloudData[table] || [],
    );

    const merged = resolveMerge(ctx);

    await db.transaction("rw", db[table], async () => {
      // Limpar local
      await db[table].clear();
      // Inserir mergeado
      await db[table].bulkAdd(merged);
    });
  }
}

async function syncNow() {
  // ... lógica de sync existente ...
  // Mas agora usa timestamps para detectar conflitos
}
```

## Critérios de Aceitação

- [ ] Sync usa timestamps para resolver conflitos
- [ ] Dados mais recentes prevalecem
- [ ] Não perde dados de nenhum lado
- [ ] Performance aceitável com merge
- [ ] Logging de merge para debug

## Checklist de Testes

- [ ] Cloud mais novo → cloud persiste
- [ ] Local mais novo → local persiste
- [ ] Conflito detectado e resolvido automaticamente
- [ ] Dados órfãos não são perdidos
- [ ] Sync incremental funciona
