<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { configStore, toast, uiStore } from '$lib/stores';
  import { cleanupOldData, db, exportDatabase, importDatabase, initializeDatabase } from '$lib/db.js';
  import { getCloudStatus, restoreFromCloudIfNeeded, scheduleCloudSync, setCloudSyncSuspended, syncNow } from '$lib/cloud/sync.js';
  import { supabase } from '$lib/cloud/supabase.js';
  import { importStudeiBackupPayload, isStudeiBackupPayload } from '$lib/importers/studeiBackup.js';
  import { clearDraft, loadDraft, saveDraft } from '$lib/utils/draft.js';
  import InteractiveCard from '$lib/components/common/InteractiveCard.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { COLORS } from '$lib/design/tokens.mjs';

  const SETTINGS_DRAFT_KEY = 'study.settings.form.v1';

  let loading = true;
  let importing = false;
  let syncingCloud = false;
  let restoringCloud = false;
  let enableDraftSave = false;
  let cloudStatus = { enabled: false, authenticated: false };
  let clearing = false;

  let email = '';
  let authLoading = false;
  let authMessage = '';

  let form = {
    userName: '',
    examName: '',
    examDate: '',
    institution: '',
    weeklyHours: 20,
    newCardsPerDay: 20,
    maxReviewsPerDay: 200,
    requestRetention: 0.85,
    maxInterval: 365,
    theme: 'system',
    tutorMode: 'active',
    pomodoroEnabled: true,
    feynmanEnabled: false
  };

  $: if (enableDraftSave) {
    saveDraft(SETTINGS_DRAFT_KEY, form);
  }

  onMount(async () => {
    await initializeDatabase();
    const cfg = await configStore.load();
    hydrateForm(cfg);

    const draft = loadDraft(SETTINGS_DRAFT_KEY, null);
    if (draft) {
      form = { ...form, ...draft };
    }

    loading = false;
    enableDraftSave = true;
    cloudStatus = await getCloudStatus();

    if (supabase) {
      supabase.auth.onAuthStateChange(async () => {
        cloudStatus = await getCloudStatus();
      });
    }
  });

  function hydrateForm(cfg) {
    form = {
      userName: cfg.userName || '',
      examName: cfg.targetExam?.name || '',
      examDate: cfg.targetExam?.date || '',
      institution: cfg.targetExam?.institution || '',
      weeklyHours: cfg.schedule?.weeklyHours || 20,
      newCardsPerDay: cfg.preferences?.newCardsPerDay || 20,
      maxReviewsPerDay: cfg.preferences?.maxReviewsPerDay || 200,
      requestRetention: cfg.fsrsParams?.requestRetention || 0.85,
      maxInterval: cfg.fsrsParams?.maximumInterval || 365,
      theme: cfg.preferences?.theme || 'system',
      tutorMode: cfg.tutor?.mode || 'active',
      pomodoroEnabled: cfg.preferences?.pomodoroEnabled ?? true,
      feynmanEnabled: cfg.preferences?.feynmanEnabled ?? false
    };
  }

  async function handleLogin() {
    if (!email) return;
    authLoading = true;
    authMessage = '';
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/settings'
      }
    });

    if (error) {
      toast('Erro ao enviar link: ' + error.message, 'error');
    } else {
      authMessage = 'Link enviado para seu email!';
      toast('Verifique seu email para acessar.', 'info');
    }
    authLoading = false;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    cloudStatus = await getCloudStatus();
    toast('Você saiu da conta.', 'info');
  }

  async function save() {
    await configStore.save({
      userName: form.userName.trim(),
      targetExam: {
        ...$configStore.targetExam,
        name: form.examName.trim(),
        date: form.examDate || null,
        institution: form.institution.trim()
      },
      schedule: {
        ...$configStore.schedule,
        weeklyHours: Number(form.weeklyHours || 20)
      },
      preferences: {
        ...$configStore.preferences,
        newCardsPerDay: Number(form.newCardsPerDay || 20),
        maxReviewsPerDay: Number(form.maxReviewsPerDay || 200),
        theme: form.theme,
        pomodoroEnabled: form.pomodoroEnabled,
        feynmanEnabled: form.feynmanEnabled
      }
    });

    await configStore.updateFSRS({
      requestRetention: Number(form.requestRetention || 0.85),
      maximumInterval: Number(form.maxInterval || 365)
    });

    await configStore.setTutorMode(form.tutorMode);

    clearDraft(SETTINGS_DRAFT_KEY);
    toast('Configurações salvas com sucesso.', 'success');
  }

  async function resetDraftToSaved() {
    const cfg = await configStore.load();
    hydrateForm(cfg);
    clearDraft(SETTINGS_DRAFT_KEY);
    toast('Rascunho descartado.', 'info');
  }

  async function downloadBackup() {
    const backup = await exportDatabase();
    const payload = JSON.stringify(backup, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sistemao-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Backup exportado.', 'success');
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      importing = true;
      const text = await file.text();
      const data = JSON.parse(text);

      if (isStudeiBackupPayload(data)) {
        setCloudSyncSuspended(true);
        const result = await importStudeiBackupPayload(data);
        toast(`Importação STUDEI concluída.`, 'success');
        scheduleCloudSync('legacy_import', 300);
      } else {
        await importDatabase(data);
        const cfg = await configStore.load();
        hydrateForm(cfg);
        clearDraft(SETTINGS_DRAFT_KEY);
        toast('Backup importado com sucesso.', 'success');
      }
    } catch (error) {
      console.error(error);
      toast('Falha ao importar arquivo.', 'error');
    } finally {
      setCloudSyncSuspended(false);
      importing = false;
      event.target.value = '';
    }
  }

  async function syncCloudNow() {
    try {
      syncingCloud = true;
      const result = await syncNow('settings_manual_sync');
      if (result.synced) {
        toast('Sincronização concluída.', 'success');
      } else {
        toast(`Sync falhou: ${result.reason}`, 'warning');
      }
    } catch (e) {
      toast('Falha na sincronização.', 'error');
    } finally {
      syncingCloud = false;
      cloudStatus = await getCloudStatus();
    }
  }

  async function restoreCloudSnapshot() {
    try {
      restoringCloud = true;
      const result = await restoreFromCloudIfNeeded({ force: true });
      if (result.restored) {
        toast('Snapshot restaurado.', 'success');
      } else {
        toast(`Falha ao restaurar: ${result.reason}`, 'warning');
      }
    } catch (e) {
      toast('Falha ao restaurar.', 'error');
    } finally {
      restoringCloud = false;
      cloudStatus = await getCloudStatus();
    }
  }

  async function handleCleanup() {
    const confirmed = await uiStore.confirm(
      'Isso removerá logs de revisão com mais de 365 dias para otimizar o banco de dados.',
      { title: 'Limpar Histórico', variant: 'warning', confirmLabel: 'Limpar Agora' }
    );
    if (!confirmed) return;

    await cleanupOldData(365);
    toast('Logs antigos limpos.', 'info');
  }

  async function confirmClearAll() {
    const confirmed = await uiStore.confirm(
      'Todos os seus dados (matérias, cards, progresso) serão APAGADOS permanentEMENTE. Esta ação é irreversível.',
      { title: 'Ação Irreversível', variant: 'danger', confirmLabel: 'Sim, Apagar Tudo' }
    );
    
    if (!confirmed) return;

    clearing = true;
    try {
      await db.delete();
      await db.open();
      await initializeDatabase();
      await configStore.load();
      toast('Todos os dados foram apagados.', 'success');
      window.location.href = '/';
    } catch (e) {
      toast('Erro ao limpar dados.', 'error');
    } finally {
      clearing = false;
    }
  }
</script>

<svelte:head>
  <title>Configurações | Sistemão</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-fade-in">
  <header class="mb-10">
    <a href="/" class="group inline-flex items-center gap-2 text-slate-400 hover:text-primary-500 transition-colors mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span class="text-[10px] font-black uppercase tracking-widest">Painel</span>
    </a>
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <h1 class="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">Configurações</h1>
      <a href="/help" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
        <span>❓</span>
        Central de Ajuda
      </a>
    </div>
  </header>

  {#if loading}
    <div class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-10 h-10 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin"></div>
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Preferências...</span>
    </div>
  {:else}
    <div class="space-y-8">
      <!-- Profile Section -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">Perfil e Prova</h3>
        <InteractiveCard padding="lg">
           <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="space-y-1.5">
               <label for="userName" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Seu Nome</label>
               <input id="userName" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.userName} />
             </div>
             <div class="space-y-1.5">
               <label for="examName" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Concurso Alvo</label>
               <input id="examName" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.examName} />
             </div>
             <div class="space-y-1.5">
               <label for="institution" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Instituição</label>
               <input id="institution" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.institution} />
             </div>
             <div class="space-y-1.5">
               <label for="examDate" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Data da Prova</label>
               <input id="examDate" type="date" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.examDate} />
             </div>
           </div>
        </InteractiveCard>
      </section>

      <!-- Routine Section -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">Rotina e Intensidade</h3>
        <InteractiveCard padding="lg">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-1.5">
              <label for="weeklyHours" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Horas Semanais</label>
              <input id="weeklyHours" type="number" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.weeklyHours} />
            </div>
            <div class="space-y-1.5">
              <label for="newCardsPerDay" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Novos Cards / Dia</label>
              <input id="newCardsPerDay" type="number" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.newCardsPerDay} />
            </div>
            <div class="space-y-1.5">
              <label for="maxReviewsPerDay" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Limite de Revisões / Dia</label>
              <input id="maxReviewsPerDay" type="number" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.maxReviewsPerDay} />
            </div>
          </div>
        </InteractiveCard>
      </section>

      <!-- FSRS Section -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">Parâmetros de Memória (FSRS)</h3>
        <InteractiveCard padding="lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <div class="space-y-1.5">
                <label for="retentionRange" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Retenção Alvo: {Math.round(form.requestRetention * 100)}%</label>
                <input id="retentionRange" type="range" min="0.75" max="0.95" step="0.01" class="w-full accent-primary-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" bind:value={form.requestRetention} />
                <p class="text-[10px] font-bold text-slate-400 italic">Retenções maiores exigem mais tempo de estudo diário.</p>
              </div>
              <div class="space-y-1.5 pt-2">
                <label for="maxInterval" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Intervalo Máximo (dias)</label>
                <input id="maxInterval" type="number" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.maxInterval} />
              </div>
            </div>
            
            <div class="p-5 bg-primary-500/5 rounded-2xl border border-primary-500/10">
              <h4 class="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="12" x2="12.01" y2="12"></line></svg>
                Dica de Especialista
              </h4>
              <p class="text-[11px] font-bold text-primary-600/80 leading-relaxed italic">
                O algorítmo FSRS v5 adapta-se ao seu histórico. Não mude a retenção alvo com frequência para não causar instabilidade na geração da fila.
              </p>
            </div>
          </div>
        </InteractiveCard>
      </section>

      <!-- Tutor Section -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">Inteligência do Tutor</h3>
        <InteractiveCard padding="lg">
           <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
             {#each [
               { id: 'passive', label: 'Passivo', desc: 'Sugere tópicos mas permite liberdade total.', icon: '💡' },
               { id: 'active', label: 'Ativo', desc: 'Prioriza matérias críticas com firmeza.', icon: '🧠' },
               { id: 'strict', label: 'Estrito', desc: 'Foco total em uma matéria até o domínio.', icon: '🎯' }
              ] as mode}
                <label class="flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer {form.tutorMode === mode.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}">
                  <input type="radio" name="tutor-mode" class="hidden" value={mode.id} bind:group={form.tutorMode} />
                  <div class="flex items-center justify-between">
                    <span class="text-2xl">{mode.icon}</span>
                    {#if form.tutorMode === mode.id}
                      <div class="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    {/if}
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{mode.label}</span>
                    <span class="text-[10px] font-bold text-slate-400 leading-tight mt-1">{mode.desc}</span>
                  </div>
                </label>
              {/each}
            </div>
            
            <details class="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <summary class="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest cursor-pointer select-none flex items-center gap-2">
                <span>ℹ️</span> O que muda em cada modo?
              </summary>
              <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <h5 class="font-black text-slate-700 dark:text-slate-300 mb-2">💡 Passivo</h5>
                  <ul class="space-y-1 text-slate-500 dark:text-slate-400 font-medium">
                    <li>• Para quem está descobrindo o sistema</li>
                    <li>• Sugere tópicos, você decide</li>
                    <li>• Sem bloqueios pedagógicos</li>
                  </ul>
                </div>
                <div>
                  <h5 class="font-black text-slate-700 dark:text-slate-300 mb-2">🧠 Ativo <span class="ml-1 px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[9px] rounded">Recomendado</span></h5>
                  <ul class="space-y-1 text-slate-500 dark:text-slate-400 font-medium">
                    <li>• Para estudo consistente diário</li>
                    <li>• Recomenda missão ideal</li>
                    <li>• Alerta se pulou muito</li>
                  </ul>
                </div>
                <div>
                  <h5 class="font-black text-slate-700 dark:text-slate-300 mb-2">🎯 Estrito</h5>
                  <ul class="space-y-1 text-slate-500 dark:text-slate-400 font-medium">
                    <li>• Para mastery de um assunto</li>
                    <li>• Bloqueia se pular etapas</li>
                    <li>• Melhor para concursos próximos</li>
                  </ul>
                </div>
              </div>
            </details>
          </InteractiveCard>
      </section>

      <!-- Study Techniques -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-350">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">Técnicas de Estudo</h3>
        <InteractiveCard padding="lg">
          <div class="space-y-4">
            <label class="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-500/50 transition-all cursor-pointer">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🍅</span>
                <div class="flex flex-col">
                  <span class="text-sm font-black text-slate-800 dark:text-white">Pomodoro</span>
                  <span class="text-[10px] font-bold text-slate-400">Sugere pausas a cada 25 minutos</span>
                </div>
              </div>
              <input type="checkbox" bind:checked={form.pomodoroEnabled} class="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
            </label>
            
            <label class="flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-500/50 transition-all cursor-pointer">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🧠</span>
                <div class="flex flex-col">
                  <span class="text-sm font-black text-slate-800 dark:text-white">Modo Feynman</span>
                  <span class="text-[10px] font-bold text-slate-400">Exija explicação antes de ver a resposta</span>
                </div>
              </div>
              <input type="checkbox" bind:checked={form.feynmanEnabled} class="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
            </label>
          </div>
        </InteractiveCard>
      </section>

      <!-- Cloud Sync -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">Sincronização na Nuvem <span class="ml-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] rounded">experimental</span></h3>
        <InteractiveCard padding="lg">
          {#if cloudStatus.enabled}
            {#if !cloudStatus.authenticated}
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <h4 class="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2">Conectar Conta</h4>
                  <p class="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-4">Entre com seu email para sincronizar seus dados de forma segura entre dispositivos.</p>
                  
                  <div class="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="email" 
                      placeholder="seu@email.com" 
                      bind:value={email}
                      class="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold focus:border-primary-500 outline-none"
                    />
                    <button 
                      on:click={handleLogin}
                      disabled={authLoading}
                      class="px-6 py-2 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all disabled:opacity-50"
                    >
                      {authLoading ? 'Enviando...' : 'Enviar Link'}
                    </button>
                  </div>
                  {#if authMessage}
                    <p class="text-[9px] font-bold text-emerald-600 mt-2">{authMessage}</p>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div class="flex items-start gap-3">
                  <span class="text-xl">⚠️</span>
                  <div class="text-xs">
                    <h5 class="font-black text-amber-700 dark:text-amber-400 mb-2">Dados Protegidos</h5>
                    <ul class="space-y-1 text-slate-600 dark:text-slate-400 font-medium">
                      <li>• <strong>Sessão Ativa:</strong> {cloudStatus.userEmail}</li>
                      <li>• <strong>Segurança:</strong> Apenas você pode ler/escrever seus snapshots (RLS Ativo).</li>
                      <li>• <strong>Exportação:</strong> Continue fazendo backups manuais periodicamente.</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                  <div class="relative flex h-3 w-3">
                     {#if cloudStatus.online && cloudStatus.syncing}
                       <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                     {/if}
                     <span class="relative inline-flex rounded-full h-3 w-3 {cloudStatus.online ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                  </div>
                  <div>
                    <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Sincronização Ativa</h4>
                    <button on:click={handleLogout} class="text-[9px] font-black text-rose-500 uppercase hover:underline">Sair da conta</button>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <button 
                    on:click={syncCloudNow} 
                    disabled={syncingCloud}
                    class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    {syncingCloud ? 'Sincronizando...' : 'Sincronizar Agora'}
                  </button>
                  <button 
                    on:click={restoreCloudSnapshot} 
                    disabled={restoringCloud}
                    class="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-black uppercase tracking-widest transition-all hover:bg-rose-50 disabled:opacity-50"
                  >
                    {restoringCloud ? 'Restaurando...' : 'Restaurar Snapshot'}
                  </button>
                </div>
              </div>
            {/if}
          {:else}
            <div class="text-center py-4">
               <p class="text-xs font-bold text-slate-400">Supabase não configurado. Adicione <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> ao seu <code>.env</code>.</p>
            </div>
          {/if}
        </InteractiveCard>
      </section>

      <!-- Appearance & Backup -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
        <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-4">Aparência e Backup</h3>
        <InteractiveCard padding="lg">
           <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div class="space-y-4">
                <div class="space-y-1.5">
                  <label for="themeSelect" class="text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">Tema Visual</label>
                  <select id="themeSelect" class="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-primary-500 transition-all outline-none" bind:value={form.theme}>
                    <option value="system">Sincronizar com Sistema</option>
                    <option value="light">Claro (Focus Mode)</option>
                    <option value="dark">Escuro (Night Mode)</option>
                  </select>
                </div>
             </div>
             
             <div class="flex flex-col gap-3">
                <button 
                  on:click={downloadBackup}
                  class="w-full py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  📥 Exportar Backup JSON
                </button>
                <label for="fileImport" class="w-full py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-center cursor-pointer">
                  <input id="fileImport" type="file" accept="application/json" class="hidden" on:change={handleImport} disabled={importing} />
                  {importing ? 'Processando...' : '📂 Importar Backup'}
                </label>
              </div>
            </div>
        </InteractiveCard>
      </section>

      <!-- Danger Zone -->
      <section class="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
        <h3 class="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1 mb-4">⚠️ Zona de Perigo</h3>
        <InteractiveCard padding="lg">
          <div class="space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
              <div>
                <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Manutenção de Dados</h4>
                <p class="text-[10px] font-bold text-slate-400 mt-1">Remove logs de revisão com mais de 365 dias.</p>
              </div>
              <button 
                on:click={handleCleanup}
                class="px-4 py-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
              >
                Limpar Histórico Antigo
              </button>
            </div>

            <div class="border-2 border-rose-200 dark:border-rose-900 rounded-2xl p-6 bg-rose-50/50 dark:bg-rose-950/20">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight text-red-600">Apagar Tudo</h4>
                  <p class="text-[10px] font-bold text-slate-400 mt-1">Elimina permanentemente matérias, cards e progresso.</p>
                </div>
                <button 
                  on:click={confirmClearAll}
                  disabled={clearing}
                  class="px-6 py-3 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {clearing ? 'APAGANDO...' : 'DELETAR CONTA LOCAL'}
                </button>
              </div>
            </div>
          </div>
        </InteractiveCard>
      </section>

      <!-- Final Actions -->
      <footer class="pt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
        <button on:click={resetDraftToSaved} class="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors">
          DESCARTAR ALTERAÇÕES
        </button>
        <button 
          on:click={save}
          class="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:scale-[1.05] active:scale-[0.95]"
        >
          SALVAR TUDO
        </button>
      </footer>
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>
