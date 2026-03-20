# TASK-006 — Diferenciar Visualmente Ações Destrutivas em Configurações

---

## 📋 IDENTIFICAÇÃO

| Campo | Valor |
|---|---|
| **ID** | TASK-006 |
| **Data de criação** | 2026-03-19 |
| **Categoria** | `UX` |
| **Prioridade** | 🟡 P1 — Importante |
| **Status** | ⏸️ Pendente |
| **Estimativa** | 1h 30min |

---

## 🎯 OBJETIVO

Aplicar hierarquia visual de risco aos botões em `/settings`: o botão "Limpar Tudo" deve ser vermelho com confirmação obrigatória via modal. O botão "Exportar Backup" deve ser estilo neutro/positivo.

---

## 🔍 CONTEXTO E PROBLEMA

**Comportamento atual:** Na tela `/settings`, os botões "Exportar Backup JSON" e "Limpar Tudo" têm o **mesmo estilo visual**, sem distinção de risco.

**Comportamento esperado:**
- "Exportar Backup JSON" → Estilo neutro (borda cinza)
- "Limpar Tudo" → Estilo de perigo (vermelho) + modal de confirmação obrigatória
- "Sincronizar Agora" → Estilo primário (roxo)

**Impacto:** Risco real de perda acidental de todos os dados do usuário.

---

## 📁 ARQUIVOS ENVOLVIDOS

| Arquivo | Ação |
|---|---|
| `src/routes/settings/+page.svelte` | `ALTERAR` |

---

## 🛠️ PASSOS DE EXECUÇÃO

### Passo 1 — Restilizar botões por categoria de risco

```svelte
<!-- Botão SEGURO — Exportar -->
<button class="border border-slate-300 text-slate-700 hover:bg-slate-50 ...">
  📥 Exportar Backup JSON
</button>

<!-- Botão DESTRUTIVO — Limpar Tudo -->
<button on:click={() => showConfirm = true}
        class="bg-red-500/10 text-red-600 border border-red-300
               hover:bg-red-500 hover:text-white ...">
  🗑️ Limpar Tudo
</button>
```

### Passo 2 — Implementar Modal de Confirmação

```svelte
<script>
  let showConfirm = false;
</script>

{#if showConfirm}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
      <div class="text-4xl text-center mb-4">⚠️</div>
      <h2 class="text-xl font-bold text-center mb-2 text-red-600">Ação Irreversível</h2>
      <p class="text-slate-600 text-sm text-center mb-6">
        Você apagará TODOS os dados: matérias, cards e histórico.
        <strong>Isso não pode ser desfeito.</strong>
      </p>
      <div class="flex gap-3">
        <button on:click={() => showConfirm = false}
                class="flex-1 border rounded-lg py-2 text-slate-700">Cancelar</button>
        <button on:click={confirmClear}
                class="flex-1 bg-red-500 text-white rounded-lg py-2 font-bold">
          Sim, apagar tudo
        </button>
      </div>
    </div>
  </div>
{/if}
```

### Passo 3 — Criar seção "Zona de Perigo"

Agrupar visualmente as ações destrutivas em uma seção com borda vermelha e aviso.

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] "Limpar Tudo" está visivelmente em vermelho
- [ ] Clicar em "Limpar Tudo" abre modal — não executa direto
- [ ] "Cancelar" no modal não apaga nada
- [ ] "Exportar Backup" tem estilo neutro (não vermelho)
- [ ] Funciona em dark mode
- [ ] Sem erros no console

---

## 🔗 DEPENDÊNCIAS

Nenhuma dependência bloqueante.

---

## 🧪 COMO TESTAR

1. Acessar `/settings`
2. ✅ "Limpar Tudo" em vermelho, diferente dos outros botões
3. Clicar → ✅ Modal de confirmação abre
4. Cancelar → ✅ Dados intactos
5. Confirmar → ✅ Dados apagados com feedback

---

## 📝 REGISTRO DE EXECUÇÃO

| Campo | Valor |
|---|---|
| **Executado por** | — |
| **Data início** | — |
| **Data fim** | — |
| **Tempo real gasto** | — |
| **Status final** | — |

---

## 🔄 HISTÓRICO

| Data | Alteração | Por |
|---|---|---|
| 2026-03-19 | Task criada após auditoria | Equipe de Auditoria |
