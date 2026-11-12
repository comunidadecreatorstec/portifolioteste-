/* =====================================================================
   FUNCIONAMENTO DO PAINEL
   A primeira coisa que este arquivo faz é conferir se você está logada.
   Sem sessão, ele manda pro login e a página nunca aparece.
   ===================================================================== */
(function () {
  'use strict';

  var db = window.banco;
  var raiz = document.documentElement;

  /* ---------- 1. CONFERÊNCIA DA SESSÃO (antes de tudo) ---------- */
  if (!db) {
    raiz.classList.remove('travado');
    document.body.innerHTML =
      '<div class="falha-total"><h1>Não consegui carregar o painel</h1>' +
      '<p>A ligação com o banco não abriu. Confira a internet e recarregue a página.</p></div>';
    return;
  }

  db.auth.getSession().then(function (r) {
    var sessao = r && r.data && r.data.session;
    if (!sessao) { location.replace('../login/'); return; }
    iniciar(sessao);
  }).catch(function () { location.replace('../login/'); });

  db.auth.onAuthStateChange(function (evento) {
    if (evento === 'SIGNED_OUT') location.replace('../login/');
  });

  /* =====================================================================
     FERRAMENTAS
     ===================================================================== */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* deixa passar só negrito e itálico do texto da biblioteca */
  const htmlSeguro = (t) => esc(t).replace(/&lt;(\/?)(b|em|strong|i|br)\s*\/?&gt;/g, '<$1$2>');
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const moeda = (v) => num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const inteiro = (v) => num(v).toLocaleString('pt-BR');
  const pad = (n) => String(n).padStart(2, '0');
  const isoLocal = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const hojeISO = () => isoLocal(new Date());
  const dataDeISO = (s) => {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  /* quantos dias de a até b (b menos a) */
  const diasEntre = (a, b) => {
    const da = dataDeISO(a), dbb = dataDeISO(b);
    return da && dbb ? Math.round((dbb - da) / 86400000) : 0;
  };
  const dataBR = (s) => { const d = dataDeISO(s); return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : ''; };
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const comparaTexto = (a, b) => String(a || '').localeCompare(String(b || ''), 'pt-BR', { sensitivity: 'base' });
  const plural = (n, um, varios) => (n === 1 ? um : varios);
  const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ícones de traço */
  const ICONES = {
    grade: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="0"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    maleta: '<rect x="2" y="7" width="20" height="14"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
    checar: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    lapis: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    lixo: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    olho: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    olhoFechado: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22"/>',
    alca: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    esq: '<path d="M15 18l-6-6 6-6"/>',
    dir: '<path d="M9 18l6-6-6-6"/>',
    estrela: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
    zap: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    insta: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    externo: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
    cima: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    baixo: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    ambos: '<path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>',
    play: '<polygon points="6 4 20 12 6 20 6 4"/>',
    certo: '<path d="M20 6L9 17l-5-5"/>'
  };
  const icone = (nome) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[nome] || '') + '</svg>';

  /* ---------- avisos e mensagens rápidas ---------- */
  const avisosVistos = new Set();
  /* tabelas que o banco disse que não existem: viram UM aviso só, com o passo a passo */
  const faltando = new Set();
  function avisarFaltando(tabela) {
    faltando.add(tabela);
    let el = document.getElementById('aviso-faltando');
    if (!el) {
      el = document.createElement('div');
      el.id = 'aviso-faltando';
      el.className = 'aviso';
      $('#avisos').prepend(el);
    }
    const lista = Array.from(faltando).map((t) => '"' + t + '"').join(', ');
    el.innerHTML = '<span><b>O banco ainda não está montado.</b> ' +
      (faltando.size === 1 ? 'Falta a tabela ' : 'Faltam as tabelas ') + esc(lista) + '. ' +
      'No Supabase, abra SQL Editor, clique em New query, cole o arquivo banco.sql inteiro e clique em Run. ' +
      'Se aparecer um aviso falando de "destructive operation", clique pra confirmar. ' +
      'Enquanto isso, o resto do painel continua funcionando.</span>' +
      '<button type="button" class="btn">Já rodei, recarregar</button>';
    el.querySelector('button').addEventListener('click', () => location.reload());
  }

  function avisar(texto) {
    if (!texto || avisosVistos.has(texto)) return;
    if (/^A tabela ".*" ainda não existe/.test(texto)) return; /* já está no aviso único */
    avisosVistos.add(texto);
    const el = document.createElement('div');
    el.className = 'aviso';
    el.innerHTML = '<span>' + esc(texto) + '</span><button type="button" aria-label="Fechar aviso">×</button>';
    el.querySelector('button').addEventListener('click', () => { el.remove(); avisosVistos.delete(texto); });
    $('#avisos').appendChild(el);
  }
  let toastTimer;
  function toast(texto, erro) {
    const t = $('#toast');
    t.textContent = texto;
    t.classList.toggle('erro', !!erro);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, erro ? 5000 : 2200);
  }

  /* traduz o erro do banco pra português */
  function explicarErro(err, tabela) {
    const code = String((err && err.code) || '');
    const msg = String((err && err.message) || err || '');
    if (code === 'PGRST205' || code === '42P01' || /could not find the table|relation .* does not exist/i.test(msg)) {
      avisarFaltando(tabela);
      return 'A tabela "' + tabela + '" ainda não existe no banco. Rode o banco.sql no Supabase.';
    }
    if (code === 'PGRST204' || code === '42703' || /column/i.test(msg)) {
      const m = msg.match(/'([^']+)' column|column "?([\w.]+)"?/i);
      const campo = m ? (m[1] || m[2] || '').replace(/^.*\./, '') : '';
      return 'Falta ' + (campo ? 'o campo "' + campo + '"' : 'um campo') + ' na tabela "' + tabela + '". Rode o banco.sql de novo no Supabase.';
    }
    if (code === '42501' || /permission|row-level|policy/i.test(msg)) {
      return 'O banco não deixou mexer na tabela "' + tabela + '". Confira se entrou com o seu e-mail e se rodou o banco.sql inteiro.';
    }
    if (code === '23514' || code === '23502') return 'Um dos valores não é aceito pela tabela "' + tabela + '". Confira os campos e tente de novo.';
    if (/fetch|network|failed to/i.test(msg)) return 'Sem conexão com o banco agora. Confira a internet.';
    if (/jwt|token/i.test(msg)) return 'A sua sessão expirou. Saia e entre de novo.';
    return 'Algo deu errado com a tabela "' + tabela + '": ' + (msg || 'erro sem descrição') + '.';
  }

  /* =====================================================================
     LEITURA E GRAVAÇÃO NO BANCO
     Cada função se protege sozinha: se der erro, avisa e devolve vazio,
     e o resto do painel segue.
     ===================================================================== */
  const D = { videos: null, marcas: null, calendario: null, campanhas: null, visitas: null, marcados: null };
  const falhou = {};

  async function lerTudo(tabela, filtro) {
    const pagina = 1000;
    let tudo = [];
    try {
      for (let de = 0; de < 100000; de += pagina) {
        let q = db.from(tabela).select('*');
        if (filtro) q = filtro(q);
        const { data, error } = await q.range(de, de + pagina - 1);
        if (error) { falhou[tabela] = true; avisar(explicarErro(error, tabela)); return null; }
        tudo = tudo.concat(data || []);
        if (!data || data.length < pagina) break;
      }
      falhou[tabela] = false;
      return tudo;
    } catch (e) {
      falhou[tabela] = true;
      avisar(explicarErro(e, tabela));
      return null;
    }
  }

  /* garante que cada linha tem todos os campos, mesmo se faltar algum no banco */
  const PADRAO = {
    videos: { titulo: '', link: '', nicho: '', formato: '', marca: '', destaque: '', ordem: 0, visivel: true },
    marcas: { nome: '', instagram: '', email: '', telefone: '', situacao: 'lead', obs: '', ultimo_contato: null },
    calendario: { titulo: '', marca: '', tipo: 'gravar', data: null, status: 'a fazer' },
    campanhas: { campanha: '', cliente: '', tipo: 'Conteúdo', status: 'Briefing', qtd: 0, valor: 0, prazo: null, pagamento: 'pendente', ativa: true, favorita: false },
    visitas: { data: null, pagina: '', origem: '' },
    marcados: { chave: '', marcado: false }
  };
  const normal = (tabela, linha) => {
    const p = PADRAO[tabela] || {};
    const r = Object.assign({}, p, linha || {});
    Object.keys(p).forEach((k) => { if (r[k] == null && p[k] != null) r[k] = p[k]; });
    return r;
  };

  async function carregar(tabela, filtro) {
    const linhas = await lerTudo(tabela, filtro);
    D[tabela] = (linhas || []).map((l) => normal(tabela, l));
    return D[tabela];
  }

  async function gravar(tabela, dados, id) {
    try {
      const q = id == null
        ? db.from(tabela).insert(dados).select().single()
        : db.from(tabela).update(dados).eq('id', id).select().single();
      const { data, error } = await q;
      if (error) { const m = explicarErro(error, tabela); toast(m, true); avisar(m); return null; }
      const linha = normal(tabela, data);
      const lista = D[tabela] || (D[tabela] = []);
      const i = lista.findIndex((x) => x.id === linha.id);
      if (i > -1) lista[i] = linha; else lista.push(linha);
      return linha;
    } catch (e) {
      const m = explicarErro(e, tabela); toast(m, true); avisar(m); return null;
    }
  }

  async function apagar(tabela, id) {
    try {
      const { error } = await db.from(tabela).delete().eq('id', id);
      if (error) { const m = explicarErro(error, tabela); toast(m, true); avisar(m); return false; }
      D[tabela] = (D[tabela] || []).filter((x) => x.id !== id);
      return true;
    } catch (e) {
      const m = explicarErro(e, tabela); toast(m, true); avisar(m); return false;
    }
  }

  /* =====================================================================
     JANELA (MODAL) E FORMULÁRIOS
     ===================================================================== */
  let focoAntes = null;
  function abrirModal(html, largo) {
    focoAntes = document.activeElement;
    const r = $('#modal-raiz');
    r.innerHTML = '<div class="modal"><div class="modal-fundo" data-fechar></div>' +
      '<div class="modal-caixa' + (largo ? ' largo' : '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
    const caixa = $('.modal-caixa', r);
    r.querySelector('.modal').addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fecharModal(); });
    const foco = caixa.querySelector('input:not([type="checkbox"]), select, textarea, button:not([data-fechar])') || caixa.querySelector('button');
    if (foco) setTimeout(() => foco.focus(), 20);
    const titulo = caixa.querySelector('h2');
    if (titulo) { titulo.id = 'modal-titulo'; caixa.setAttribute('aria-labelledby', 'modal-titulo'); }
    return caixa;
  }
  function fecharModal() {
    $('#modal-raiz').innerHTML = '';
    if (focoAntes && focoAntes.focus && document.body.contains(focoAntes)) focoAntes.focus();
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if ($('#modal-raiz').innerHTML) fecharModal();
      else fecharGaveta();
    }
  });
  const cabecaModal = (titulo) =>
    '<div class="modal-cabeca"><h2>' + esc(titulo) + '</h2><button type="button" class="icone-btn" data-fechar aria-label="Fechar">' + icone('x') + '</button></div>';

  let idCampo = 0;
  function campoHTML(c, valor) {
    const id = 'cmp-' + (++idCampo);
    const largo = c.largo ? ' largo' : '';
    const req = c.obrigatorio ? ' required' : '';
    const v = valor == null ? '' : valor;
    if (c.tipo === 'checkbox') {
      return '<label class="campo check' + largo + '"><input type="checkbox" name="' + c.nome + '"' + (v ? ' checked' : '') + '><span>' + esc(c.rotulo) + '</span></label>';
    }
    let input;
    if (c.tipo === 'select') {
      input = '<select id="' + id + '" name="' + c.nome + '">' +
        c.opcoes.map((o) => { const ov = typeof o === 'object' ? o.v : o; const ot = typeof o === 'object' ? o.t : o; return '<option value="' + esc(ov) + '"' + (String(ov) === String(v) ? ' selected' : '') + '>' + esc(ot) + '</option>'; }).join('') +
        '</select>';
    } else if (c.tipo === 'textarea') {
      input = '<textarea id="' + id + '" name="' + c.nome + '"' + req + ' placeholder="' + esc(c.dica || '') + '">' + esc(v) + '</textarea>';
    } else {
      const lista = c.sugestoes && c.sugestoes.length ? id + '-l' : '';
      input = '<input id="' + id + '" name="' + c.nome + '" type="' + (c.tipo || 'text') + '"' + req +
        (c.tipo === 'number' ? ' step="' + (c.passo || '1') + '" min="0" inputmode="decimal"' : '') +
        (lista ? ' list="' + lista + '"' : '') +
        ' value="' + esc(v) + '" placeholder="' + esc(c.dica || '') + '" autocomplete="off">' +
        (lista ? '<datalist id="' + lista + '">' + c.sugestoes.map((s) => '<option value="' + esc(s) + '">').join('') + '</datalist>' : '');
    }
    return '<label class="campo' + largo + '" for="' + id + '"><span>' + esc(c.rotulo) + (c.obrigatorio ? ' *' : '') + '</span>' + input + '</label>';
  }

  /* monta um formulário dentro da janela */
  function formulario(o) {
    const valores = o.valores || {};
    const caixa = abrirModal(
      '<form novalidate>' + cabecaModal(o.titulo) +
      '<div class="campos">' + o.campos.map((c) => campoHTML(c, valores[c.nome])).join('') + '</div>' +
      '<p class="form-erro" hidden></p>' +
      '<div class="modal-pe">' +
        (o.aoApagar ? '<button type="button" class="btn perigo" data-apagar>' + icone('lixo') + 'Apagar</button>' : '') +
        (o.extraPe || '') +
        '<span class="espaco"></span><button type="button" class="btn" data-fechar>Cancelar</button>' +
        '<button type="submit" class="btn primario">Salvar</button>' +
      '</div></form>', o.largo);
    const form = $('form', caixa);
    const erro = $('.form-erro', caixa);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dados = {};
      for (const c of o.campos) {
        const el = form.elements[c.nome];
        if (!el) continue;
        let v;
        if (c.tipo === 'checkbox') v = el.checked;
        else if (c.tipo === 'number') v = el.value === '' ? 0 : num(String(el.value).replace(',', '.'));
        else if (c.tipo === 'date') v = el.value || null;
        else v = el.value.trim();
        if (c.obrigatorio && (v === '' || v == null)) {
          erro.textContent = 'Preencha o campo "' + c.rotulo + '".';
          erro.hidden = false; el.focus(); return;
        }
        dados[c.nome] = v;
      }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; btn.textContent = 'Salvando...';
      const ok = await o.aoSalvar(dados);
      if (ok) { fecharModal(); toast('Salvo'); }
      else { btn.disabled = false; btn.textContent = 'Salvar'; }
    });
    const bApagar = $('[data-apagar]', caixa);
    if (bApagar) {
      bApagar.addEventListener('click', async () => {
        if (!bApagar.dataset.certeza) {
          bApagar.dataset.certeza = '1';
          bApagar.innerHTML = icone('lixo') + 'Clique de novo pra apagar';
          return;
        }
        bApagar.disabled = true;
        const ok = await o.aoApagar();
        if (ok) { fecharModal(); toast('Apagado'); }
        else bApagar.disabled = false;
      });
    }
    if (o.depois) o.depois(caixa);
    return caixa;
  }

  /* baixa uma planilha que abre certinho no Excel, com acento */
  function baixarCSV(nomeArquivo, cabecalho, linhas) {
    const cel = (c) => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"';
    const texto = '﻿' + [cabecalho].concat(linhas).map((l) => l.map(cel).join(';')).join('\r\n');
    const blob = new Blob([texto], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivo + '-' + hojeISO() + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* =====================================================================
     NAVEGAÇÃO ENTRE AS ABAS
     ===================================================================== */
  const ABAS = {
    portfolio: { titulo: 'Portfólio', montar: abaPortfolio },
    marcas: { titulo: 'Marcas', montar: abaMarcas },
    calendario: { titulo: 'Calendário', montar: abaCalendario },
    campanhas: { titulo: 'Campanhas', montar: abaCampanhas },
    checklist: { titulo: 'Checklist portfólio', montar: abaChecklist }
  };
  const desenhos = {}; /* cada aba guarda aqui a função que redesenha ela */
  function redesenhar() {
    Object.keys(desenhos).forEach((k) => { try { desenhos[k](); } catch (e) { console.error(e); } });
  }

  async function seguro(nome, secao) {
    try {
      await ABAS[nome].montar(secao);
    } catch (e) {
      console.error(e);
      secao.innerHTML = '<div class="falha-aba">Esta aba encontrou um problema e não abriu inteira. As outras continuam funcionando. Detalhe: ' + esc(e && e.message) + '</div>';
    }
  }

  function irPara(nome) {
    if (!ABAS[nome]) nome = 'portfolio';
    $$('.aba').forEach((s) => { s.hidden = s.dataset.aba !== nome; });
    $$('.menu-nav a').forEach((a) => { if (a.dataset.aba === nome) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#titulo-aba').textContent = ABAS[nome].titulo;
    document.title = ABAS[nome].titulo + ' · Painel';
    fecharGaveta();
    const secao = $('.aba[data-aba="' + nome + '"]');
    if (!ABAS[nome].montada) {
      ABAS[nome].montada = true;
      secao.innerHTML = '<p class="vazio">Carregando...</p>';
      seguro(nome, secao);
    }
  }

  function abrirGaveta() { $('#menu').classList.add('aberto'); $('#veu').hidden = false; $('#btn-gaveta').setAttribute('aria-expanded', 'true'); }
  function fecharGaveta() { $('#menu').classList.remove('aberto'); $('#veu').hidden = true; $('#btn-gaveta').setAttribute('aria-expanded', 'false'); }

  function iniciar(sessao) {
    $$('[data-icone]').forEach((el) => { el.outerHTML = icone(el.dataset.icone); });
    /* o e-mail quebra de linha no @, nunca no meio da palavra */
    const email = (sessao.user && sessao.user.email) || '';
    $('#eu-email').innerHTML = esc(email).replace('@', '<wbr>@');
    $('#eu-email').title = email;
    $('#btn-sair').addEventListener('click', async () => {
      try { await db.auth.signOut(); } catch (e) { /* segue */ }
      location.replace('../login/');
    });
    $('#btn-gaveta').addEventListener('click', () => ($('#menu').classList.contains('aberto') ? fecharGaveta() : abrirGaveta()));
    $('#veu').addEventListener('click', fecharGaveta);
    window.addEventListener('hashchange', () => irPara(location.hash.slice(1)));
    raiz.classList.remove('travado');
    irPara(location.hash.slice(1));
  }

  /* =====================================================================
     ABA 1. PORTFÓLIO
     ===================================================================== */
  function nomeOrigem(o) { return String(o || '').trim() || 'Direto'; }

  async function abaPortfolio(sec) {
    sec.innerHTML =
      '<div class="faixa-numeros" id="pf-numeros"></div>' +
      '<div class="grade-2">' +
        '<div class="bloco"><div class="bloco-cabeca"><h2>Visitas nos últimos 14 dias</h2></div><div id="pf-grafico"></div></div>' +
        '<div class="bloco"><div class="bloco-cabeca"><h2>Por onde as pessoas chegaram</h2></div><div id="pf-origens"></div></div>' +
      '</div>' +
      '<div class="bloco"><div class="bloco-cabeca"><h2>Meus vídeos</h2><span class="dica">Arraste pela alcinha pra mudar a ordem no site</span><span class="espaco"></span>' +
        '<button class="btn primario" type="button" id="pf-add">' + icone('mais') + 'Adicionar vídeo</button></div>' +
        '<div id="pf-tabela"></div></div>';

    const inicio = new Date(); inicio.setHours(0, 0, 0, 0); inicio.setDate(inicio.getDate() - 13);
    await Promise.all([
      carregar('videos'),
      carregar('visitas', (q) => q.gte('data', inicio.toISOString()))
    ]);

    $('#pf-add').addEventListener('click', () => formVideo());
    ligarTabelaVideos();
    desenhos.portfolio = desenharPortfolio;
    desenharPortfolio();
  }

  function videosOrdenados() {
    return (D.videos || []).slice().sort((a, b) => num(a.ordem) - num(b.ordem) || num(a.id) - num(b.id));
  }

  function desenharPortfolio() {
    const visitas = D.visitas || [];
    const videos = videosOrdenados();
    const hoje = hojeISO();

    /* dias dos últimos 14 dias */
    const dias = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      dias.push({ iso: isoLocal(d), d: d, n: 0 });
    }
    const porDia = {};
    dias.forEach((x) => { porDia[x.iso] = x; });
    const origens = {};
    let total = 0, deHoje = 0;
    visitas.forEach((v) => {
      if (!v.data) return;
      const iso = isoLocal(new Date(v.data));
      if (!porDia[iso]) return;
      porDia[iso].n++;
      total++;
      if (iso === hoje) deHoje++;
      const o = nomeOrigem(v.origem);
      origens[o] = (origens[o] || 0) + 1;
    });
    const listaOrigens = Object.keys(origens).map((k) => ({ nome: k, n: origens[k] })).sort((a, b) => b.n - a.n);

    const noAr = videos.filter((v) => v.visivel);
    const nichos = {};
    noAr.forEach((v) => { const n = String(v.nicho || '').trim(); if (n) nichos[n] = (nichos[n] || 0) + 1; });
    const nichoTop = Object.keys(nichos).sort((a, b) => nichos[b] - nichos[a])[0];

    $('#pf-numeros').style.setProperty('--n', 5);
    $('#pf-numeros').innerHTML =
      caixaNumero('Visitas em 14 dias', inteiro(total)) +
      caixaNumero('Visitas hoje', inteiro(deHoje)) +
      caixaNumero('Vídeos no ar', inteiro(noAr.length)) +
      caixaNumero('Nicho mais forte', nichoTop || 'Nenhum ainda', nichoTop ? nichos[nichoTop] + ' ' + plural(nichos[nichoTop], 'vídeo', 'vídeos') : '') +
      caixaNumero('De onde mais vêm', listaOrigens[0] ? listaOrigens[0].nome : 'Sem visitas ainda', listaOrigens[0] ? pct(listaOrigens[0].n, total) + '% das visitas' : '');

    /* gráfico */
    if (total === 0) {
      $('#pf-grafico').innerHTML = '<p class="vazio">Quando as pessoas começarem a abrir o seu portfólio, aqui aparece uma barrinha pra cada dia dos últimos 14 dias, mostrando quantas visitas o site teve.</p>';
    } else {
      const max = Math.max.apply(null, dias.map((x) => x.n)) || 1;
      const sem = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
      $('#pf-grafico').innerHTML =
        '<div class="grafico" role="img" aria-label="Visitas por dia nos últimos 14 dias">' +
        dias.map((x) => '<div class="barra-dia' + (x.n ? '' : ' zero') + (x.iso === hoje ? ' hoje' : '') + '" title="' + dataBR(x.iso) + ': ' + x.n + ' ' + plural(x.n, 'visita', 'visitas') + '">' +
          '<span class="n">' + (x.n || '') + '</span><span class="b" style="height:' + (x.n ? Math.max(3, (x.n / max) * 100) : 0) + '%"></span></div>').join('') +
        '</div><div class="eixo" aria-hidden="true">' +
        dias.map((x) => '<span>' + (x.iso === hoje ? 'hoje' : sem[x.d.getDay()] + ' ' + x.d.getDate()) + '</span>').join('') + '</div>';
    }

    /* origens */
    $('#pf-origens').innerHTML = listaOrigens.length
      ? '<ul class="origens">' + listaOrigens.slice(0, 8).map((o) =>
          '<li><span>' + esc(o.nome) + '</span><span class="q">' + o.n + ' · ' + pct(o.n, total) + '%</span><span class="trilho"><i style="width:' + pct(o.n, total) + '%"></i></span></li>').join('') + '</ul>'
      : '<p class="vazio">Aqui vai aparecer de onde as pessoas vieram (Instagram, Google, WhatsApp ou link direto), assim que o site receber as primeiras visitas.</p>';

    /* tabela de vídeos */
    const caixa = $('#pf-tabela');
    if (falhou.videos) { caixa.innerHTML = '<p class="vazio">Não deu pra carregar os vídeos. Veja o aviso no topo da página.</p>'; return; }
    if (!videos.length) { caixa.innerHTML = '<p class="vazio">Nenhum vídeo ainda. Clique em "Adicionar vídeo" pra colocar o primeiro no site.</p>'; return; }
    caixa.innerHTML = '<div class="rolagem"><table class="tabela"><thead><tr>' +
      '<th class="col-alca"><span class="sr-only"></span></th><th>Título</th><th>Nicho</th><th>Formato</th><th>Marca</th><th>Destaque</th><th class="acoes">No site</th><th class="acoes"></th>' +
      '</tr></thead><tbody>' + videos.map((v) =>
        '<tr data-id="' + v.id + '" class="' + (v.visivel ? '' : 'apagado') + '">' +
        '<td class="col-alca"><button class="alca" type="button" aria-label="Arrastar ' + esc(v.titulo) + ' pra mudar a ordem (ou use as setas do teclado)">' + icone('alca') + '</button></td>' +
        '<td>' + (v.link ? '<a href="' + esc(v.link) + '" target="_blank" rel="noopener">' + esc(v.titulo || 'Sem título') + '</a>' : esc(v.titulo || 'Sem título')) + '</td>' +
        '<td class="nw">' + esc(v.nicho) + '</td><td class="nw">' + esc(v.formato) + '</td><td class="nw">' + esc(v.marca) + '</td><td class="nw">' + esc(v.destaque) + '</td>' +
        '<td class="acoes"><button class="icone-btn olho' + (v.visivel ? ' ligado' : '') + '" type="button" aria-pressed="' + !!v.visivel + '" title="' + (v.visivel ? 'Aparece no site. Clique pra esconder' : 'Escondido do site. Clique pra mostrar') + '" aria-label="' + (v.visivel ? 'Esconder do site' : 'Mostrar no site') + '">' + icone(v.visivel ? 'olho' : 'olhoFechado') + '</button></td>' +
        '<td class="acoes"><button class="icone-btn editar" type="button" aria-label="Editar">' + icone('lapis') + '</button><button class="icone-btn apagar" type="button" aria-label="Apagar">' + icone('lixo') + '</button></td>' +
        '</tr>').join('') + '</tbody></table></div>';
  }

  function caixaNumero(rotulo, valor, sub) {
    return '<div><span class="rotulo">' + esc(rotulo) + '</span><span class="valor" title="' + esc(valor) + '">' + esc(valor) + '</span>' + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</div>';
  }

  function formVideo(v) {
    const nichos = [...new Set((D.videos || []).map((x) => x.nicho).filter(Boolean))];
    const marcas = [...new Set((D.videos || []).map((x) => x.marca).concat((D.marcas || []).map((m) => m.nome)).filter(Boolean))];
    formulario({
      titulo: v ? 'Editar vídeo' : 'Novo vídeo',
      valores: v || { visivel: true },
      campos: [
        { nome: 'titulo', rotulo: 'Título', obrigatorio: true, largo: true },
        { nome: 'link', rotulo: 'Link do vídeo (Instagram ou YouTube)', tipo: 'url', largo: true, dica: 'https://www.instagram.com/p/...' },
        { nome: 'nicho', rotulo: 'Nicho', sugestoes: nichos, dica: 'Ex: Smartphones' },
        { nome: 'formato', rotulo: 'Formato', sugestoes: ['vídeo 9:16', 'foto 4:5', 'carrossel'], dica: 'Ex: vídeo 9:16' },
        { nome: 'marca', rotulo: 'Marca', sugestoes: marcas },
        { nome: 'destaque', rotulo: 'Destaque', dica: 'Ex: 2,4M views' },
        { nome: 'visivel', rotulo: 'Mostrar no site', tipo: 'checkbox' }
      ],
      aoSalvar: async (dados) => {
        if (!v) dados.ordem = (D.videos || []).reduce((m, x) => Math.max(m, num(x.ordem)), 0) + 1;
        const ok = await gravar('videos', dados, v ? v.id : null);
        if (ok) desenharPortfolio();
        return ok;
      },
      aoApagar: v ? async () => { const ok = await apagar('videos', v.id); if (ok) desenharPortfolio(); return ok; } : null
    });
  }

  function ligarTabelaVideos() {
    const caixa = $('#pf-tabela');
    const acharVideo = (el) => { const tr = el.closest('tr[data-id]'); return tr && (D.videos || []).find((x) => String(x.id) === tr.dataset.id); };

    caixa.addEventListener('click', async (e) => {
      const v = acharVideo(e.target);
      if (!v) return;
      if (e.target.closest('.olho')) {
        const ok = await gravar('videos', { visivel: !v.visivel }, v.id);
        if (ok) { desenharPortfolio(); toast(ok.visivel ? 'Agora aparece no site' : 'Escondido do site'); }
      } else if (e.target.closest('.editar')) {
        formVideo(v);
      } else if (e.target.closest('.apagar')) {
        const b = e.target.closest('.apagar');
        if (!b.dataset.certeza) { b.dataset.certeza = '1'; b.classList.add('ligado'); b.title = 'Clique de novo pra apagar'; toast('Clique de novo na lixeira pra apagar "' + (v.titulo || 'vídeo') + '"'); return; }
        if (await apagar('videos', v.id)) { desenharPortfolio(); toast('Vídeo apagado'); }
      }
    });

    /* arrastar pela alcinha (funciona com mouse e com o dedo) */
    caixa.addEventListener('pointerdown', (e) => {
      const alca = e.target.closest('.alca');
      if (!alca) return;
      e.preventDefault();
      const linha = alca.closest('tr');
      const corpo = linha.parentNode;
      const ordemAntes = $$('tr', corpo).map((t) => t.dataset.id).join(',');
      linha.classList.add('arrastando');
      document.body.classList.add('arrastando');
      try { alca.setPointerCapture(e.pointerId); } catch (err) { /* segue */ }
      const mover = (ev) => {
        const sob = document.elementFromPoint(ev.clientX, ev.clientY);
        const alvo = sob && sob.closest('tr[data-id]');
        if (!alvo || alvo === linha || alvo.parentNode !== corpo) return;
        const r = alvo.getBoundingClientRect();
        corpo.insertBefore(linha, ev.clientY > r.top + r.height / 2 ? alvo.nextSibling : alvo);
      };
      const soltar = () => {
        alca.removeEventListener('pointermove', mover);
        alca.removeEventListener('pointerup', soltar);
        alca.removeEventListener('pointercancel', soltar);
        linha.classList.remove('arrastando');
        document.body.classList.remove('arrastando');
        if ($$('tr', corpo).map((t) => t.dataset.id).join(',') !== ordemAntes) salvarOrdem(corpo);
      };
      alca.addEventListener('pointermove', mover);
      alca.addEventListener('pointerup', soltar);
      alca.addEventListener('pointercancel', soltar);
    });

    /* pelo teclado: setas pra cima e pra baixo */
    caixa.addEventListener('keydown', (e) => {
      const alca = e.target.closest('.alca');
      if (!alca || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault();
      const linha = alca.closest('tr'), corpo = linha.parentNode;
      if (e.key === 'ArrowUp' && linha.previousElementSibling) corpo.insertBefore(linha, linha.previousElementSibling);
      else if (e.key === 'ArrowDown' && linha.nextElementSibling) corpo.insertBefore(linha.nextElementSibling, linha);
      else return;
      alca.focus();
      salvarOrdem(corpo, alca);
    });
  }

  async function salvarOrdem(corpo) {
    const ids = $$('tr[data-id]', corpo).map((t) => t.dataset.id);
    const mudancas = [];
    ids.forEach((id, i) => {
      const v = (D.videos || []).find((x) => String(x.id) === id);
      if (v && num(v.ordem) !== i + 1) { v.ordem = i + 1; mudancas.push({ id: v.id, ordem: i + 1 }); }
    });
    if (!mudancas.length) return;
    try {
      const resultados = await Promise.all(mudancas.map((m) => db.from('videos').update({ ordem: m.ordem }).eq('id', m.id)));
      const erro = resultados.find((r) => r.error);
      if (erro) { toast(explicarErro(erro.error, 'videos'), true); await carregar('videos'); desenharPortfolio(); return; }
      toast('Ordem salva');
    } catch (e) {
      toast(explicarErro(e, 'videos'), true);
    }
  }

  /* =====================================================================
     ABA 2. MARCAS
     ===================================================================== */
  const SITUACOES = [
    { v: 'lead', t: 'Lead', cor: 'c-azul' },
    { v: 'conversando', t: 'Conversando', cor: 'c-amarelo' },
    { v: 'cliente', t: 'Cliente', cor: 'c-verde' },
    { v: 'parada', t: 'Parada', cor: 'c-cinza' }
  ];
  const situacao = (v) => SITUACOES.find((s) => s.v === v) || SITUACOES[0];
  const linkInsta = (t) => {
    const h = String(t || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '');
    return h ? 'https://www.instagram.com/' + encodeURIComponent(h) + '/' : '';
  };
  const arrobaInsta = (t) => {
    const h = String(t || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@/, '');
    return h ? '@' + h : '';
  };
  const linkZap = (t) => {
    let d = String(t || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return d.length >= 10 ? 'https://wa.me/' + d : '';
  };

  async function abaMarcas(sec) {
    const est = { busca: '', filtro: '' };
    sec.innerHTML =
      '<div class="barra">' +
        '<label class="busca"><span class="sr-only">Buscar</span>' + icone('lupa') + '<input type="search" id="mc-busca" placeholder="Buscar por nome, @ ou e-mail"></label>' +
        '<select id="mc-filtro" aria-label="Filtrar por situação"><option value="">Todas as situações</option>' + SITUACOES.map((s) => '<option value="' + s.v + '">' + s.t + '</option>').join('') + '</select>' +
        '<span class="contagem" id="mc-contagem"></span><span class="espaco"></span>' +
        '<button class="btn" type="button" id="mc-csv">' + icone('baixar') + 'Baixar CSV</button>' +
        '<button class="btn primario" type="button" id="mc-add">' + icone('mais') + 'Adicionar marca</button>' +
      '</div><div class="bloco" id="mc-tabela"></div>';

    await carregar('marcas');

    const filtradas = () => {
      const b = semAcento(est.busca.trim());
      return (D.marcas || [])
        .filter((m) => !est.filtro || m.situacao === est.filtro)
        .filter((m) => !b || [m.nome, m.instagram, m.email].some((x) => semAcento(x).includes(b)))
        .sort((a, b2) => comparaTexto(a.nome, b2.nome));
    };

    function desenhar() {
      const lista = filtradas();
      const total = (D.marcas || []).length;
      $('#mc-contagem').textContent = lista.length === total ? total + ' ' + plural(total, 'marca', 'marcas') : lista.length + ' de ' + total;
      const caixa = $('#mc-tabela');
      if (falhou.marcas) { caixa.innerHTML = '<p class="vazio">Não deu pra carregar as marcas. Veja o aviso no topo da página.</p>'; return; }
      if (!total) { caixa.innerHTML = '<p class="vazio">A sua base ainda está vazia. Clique em "Adicionar marca" ou espere chegar o primeiro contato pelo formulário do site.</p>'; return; }
      if (!lista.length) { caixa.innerHTML = '<p class="vazio">Nenhuma marca encontrada com essa busca.</p>'; return; }
      caixa.innerHTML = '<div class="rolagem"><table class="tabela"><thead><tr>' +
        '<th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th>' +
        '</tr></thead><tbody>' + lista.map((m) => {
          const s = situacao(m.situacao);
          const zap = linkZap(m.telefone), insta = linkInsta(m.instagram);
          return '<tr class="clicavel" data-id="' + m.id + '" tabindex="0">' +
            '<td>' + esc(m.nome || 'Sem nome') + '</td>' +
            '<td class="nw">' + (insta ? '<a href="' + esc(insta) + '" target="_blank" rel="noopener" data-fora>' + esc(arrobaInsta(m.instagram)) + '</a>' : '') + '</td>' +
            '<td class="nw">' + (m.email ? '<a href="mailto:' + esc(m.email) + '" data-fora>' + esc(m.email) + '</a>' : '') + '</td>' +
            '<td class="nw">' + esc(m.telefone) + (zap ? ' <a class="icone-btn" href="' + esc(zap) + '" target="_blank" rel="noopener" data-fora title="Abrir no WhatsApp" aria-label="Abrir conversa no WhatsApp">' + icone('zap') + '</a>' : '') + '</td>' +
            '<td><span class="pilula ' + s.cor + '">' + s.t + '</span></td>' +
            '<td class="curto" title="' + esc(m.obs) + '">' + esc(m.obs) + '</td>' +
            '<td class="nw">' + dataBR(m.ultimo_contato) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    function formMarca(m) {
      formulario({
        titulo: m ? 'Editar marca' : 'Nova marca',
        valores: m || { situacao: 'lead', ultimo_contato: hojeISO() },
        campos: [
          { nome: 'nome', rotulo: 'Marca', obrigatorio: true, largo: true },
          { nome: 'instagram', rotulo: 'Instagram', dica: '@perfil' },
          { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
          { nome: 'telefone', rotulo: 'Telefone (com DDD)', tipo: 'tel', dica: '51 99999-9999' },
          { nome: 'situacao', rotulo: 'Situação', tipo: 'select', opcoes: SITUACOES },
          { nome: 'ultimo_contato', rotulo: 'Último contato', tipo: 'date' },
          { nome: 'obs', rotulo: 'Observação', tipo: 'textarea', largo: true }
        ],
        aoSalvar: async (dados) => { const ok = await gravar('marcas', dados, m ? m.id : null); if (ok) desenhar(); return ok; },
        aoApagar: m ? async () => { const ok = await apagar('marcas', m.id); if (ok) desenhar(); return ok; } : null
      });
    }

    $('#mc-busca').addEventListener('input', (e) => { est.busca = e.target.value; desenhar(); });
    $('#mc-filtro').addEventListener('change', (e) => { est.filtro = e.target.value; desenhar(); });
    $('#mc-add').addEventListener('click', () => formMarca());
    $('#mc-csv').addEventListener('click', () => {
      baixarCSV('marcas', ['Marca', 'Instagram', 'E-mail', 'Telefone', 'Situação', 'Observação', 'Último contato'],
        filtradas().map((m) => [m.nome, arrobaInsta(m.instagram), m.email, m.telefone, situacao(m.situacao).t, m.obs, dataBR(m.ultimo_contato)]));
    });
    const abrirLinha = (e) => {
      if (e.target.closest('[data-fora]')) return;
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const m = (D.marcas || []).find((x) => String(x.id) === tr.dataset.id);
      if (m) formMarca(m);
    };
    $('#mc-tabela').addEventListener('click', abrirLinha);
    $('#mc-tabela').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('tr')) abrirLinha(e); });

    desenhos.marcas = desenhar;
    desenhar();
  }

  /* =====================================================================
     ABA 3. CALENDÁRIO
     ===================================================================== */
  const TIPOS_CAL = [
    { v: 'gravar', t: 'Gravar' },
    { v: 'editar', t: 'Editar' },
    { v: 'postar', t: 'Postar' }
  ];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  async function abaCalendario(sec) {
    const agora = new Date();
    const est = { ano: agora.getFullYear(), mes: agora.getMonth(), filtro: '' };

    sec.innerHTML =
      '<div class="barra">' +
        '<div class="cal-nav"><button class="icone-btn" type="button" id="cal-ant" aria-label="Mês anterior">' + icone('esq') + '</button>' +
        '<h2 class="cal-mes" id="cal-mes" aria-live="polite"></h2>' +
        '<button class="icone-btn" type="button" id="cal-prox" aria-label="Próximo mês">' + icone('dir') + '</button></div>' +
        '<button class="btn" type="button" id="cal-hoje">Este mês</button>' +
        '<div class="chips" role="group" aria-label="Filtrar por tipo" id="cal-filtro">' +
          '<button class="chip" type="button" data-v="" aria-pressed="true">Todos</button>' +
          TIPOS_CAL.map((t) => '<button class="chip" type="button" data-v="' + t.v + '" aria-pressed="false">' + t.t + '</button>').join('') +
        '</div><span class="espaco"></span>' +
        '<span class="legenda"><span class="t-gravar"><i></i>Gravar</span><span class="t-editar"><i></i>Editar</span><span class="t-postar"><i></i>Postar</span><span class="t-prazo"><i></i>Prazo de campanha</span></span>' +
        '<button class="btn primario" type="button" id="cal-add">' + icone('mais') + 'Adicionar</button>' +
      '</div>' +
      '<div class="cal-grade" id="cal-grade"></div>' +
      '<div class="bloco"><div class="bloco-cabeca"><h2>Ficou pra trás</h2><span class="dica">O que passou do dia e não foi feito</span></div><div id="cal-atras"></div></div>';

    await Promise.all([carregar('calendario'), D.campanhas ? null : carregar('campanhas')]);

    /* itens de um dia: os do calendário + os prazos das campanhas */
    function itensDoDia(iso) {
      const cal = (D.calendario || [])
        .filter((c) => c.data && String(c.data).slice(0, 10) === iso)
        .filter((c) => !est.filtro || c.tipo === est.filtro)
        .map((c) => ({ tipo: c.tipo, texto: c.titulo + (c.marca ? ' · ' + c.marca : ''), feito: c.status === 'feito', cal: c }));
      const prazos = est.filtro ? [] : (D.campanhas || [])
        .filter((c) => c.prazo && String(c.prazo).slice(0, 10) === iso)
        .map((c) => ({ tipo: 'prazo', texto: 'Prazo: ' + c.campanha + (c.cliente ? ' · ' + c.cliente : ''), feito: c.status === 'Entregue', camp: c }));
      return cal.concat(prazos).sort((a, b) => (a.feito - b.feito));
    }

    function itemHTML(it, i) {
      return '<li><button type="button" class="cal-item t-' + esc(it.tipo) + (it.feito ? ' feito' : '') + '" data-ref="' + (it.cal ? 'c' + it.cal.id : 'p' + it.camp.id) + '" title="' + esc(it.texto) + '">' + esc(it.texto) + '</button></li>';
    }

    function desenhar() {
      $('#cal-mes').textContent = MESES[est.mes].charAt(0).toUpperCase() + MESES[est.mes].slice(1) + ' de ' + est.ano;
      $$('#cal-filtro .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.v === est.filtro)));
      const primeiro = new Date(est.ano, est.mes, 1);
      const recuo = (primeiro.getDay() + 6) % 7; /* semana começa na segunda */
      const inicio = new Date(est.ano, est.mes, 1 - recuo);
      const diasNoMes = new Date(est.ano, est.mes + 1, 0).getDate();
      const semanas = Math.ceil((recuo + diasNoMes) / 7);
      const hoje = hojeISO();
      let html = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => '<div class="cal-sem">' + d + '</div>').join('');
      for (let i = 0; i < semanas * 7; i++) {
        const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
        const iso = isoLocal(d);
        const itens = itensDoDia(iso);
        const fora = d.getMonth() !== est.mes;
        html += '<div class="cal-dia' + (fora ? ' fora' : '') + (iso === hoje ? ' hoje' : '') + '" data-dia="' + iso + '">' +
          '<div class="cal-dia-topo"><span class="cal-num">' + d.getDate() + '</span>' +
          '<button type="button" class="cal-add" data-add="' + iso + '" aria-label="Adicionar em ' + dataBR(iso) + '">' + icone('mais') + '</button></div>' +
          '<ul class="cal-itens">' + itens.slice(0, 3).map(itemHTML).join('') + '</ul>' +
          (itens.length > 3 ? '<button type="button" class="cal-ver-mais" data-dia-mais="' + iso + '">+' + (itens.length - 3) + ' mais</button>' : '') +
          '</div>';
      }
      $('#cal-grade').innerHTML = html;
      desenharAtrasados();
    }

    function desenharAtrasados() {
      const hoje = hojeISO();
      const lista = [];
      (D.calendario || []).forEach((c) => {
        if (c.data && String(c.data).slice(0, 10) < hoje && c.status !== 'feito') lista.push({ cal: c, data: String(c.data).slice(0, 10), texto: c.titulo, sub: (TIPOS_CAL.find((t) => t.v === c.tipo) || { t: c.tipo }).t + (c.marca ? ' · ' + c.marca : '') });
      });
      (D.campanhas || []).forEach((c) => {
        if (c.prazo && String(c.prazo).slice(0, 10) < hoje && c.status !== 'Entregue' && c.ativa !== false) lista.push({ camp: c, data: String(c.prazo).slice(0, 10), texto: 'Prazo: ' + c.campanha, sub: 'Campanha · ' + (c.cliente || '') + ' · ' + c.status });
      });
      lista.sort((a, b) => (a.data < b.data ? -1 : 1));
      const caixa = $('#cal-atras');
      if (!lista.length) { caixa.innerHTML = '<p class="vazio">Nada atrasado. Tudo em dia por aqui.</p>'; return; }
      caixa.innerHTML = '<ul class="lista-simples">' + lista.map((x) => {
        const dias = diasEntre(x.data, hoje);
        return '<li><span class="texto"><b>' + esc(x.texto) + '</b><span class="sub-linha">' + esc(x.sub) + ' · era pra ' + dataBR(x.data) + '</span></span>' +
          '<span class="quando">há ' + dias + ' ' + plural(dias, 'dia', 'dias') + '</span>' +
          (x.cal ? '<button class="btn" type="button" data-feito="' + x.cal.id + '">' + icone('certo') + 'Feito</button>' : '<button class="btn" type="button" data-camp="' + x.camp.id + '">Abrir</button>') +
          '</li>';
      }).join('') + '</ul>';
    }

    function formItem(item, dataPadrao) {
      const marcas = [...new Set((D.marcas || []).map((m) => m.nome).concat((D.campanhas || []).map((c) => c.cliente)).filter(Boolean))];
      formulario({
        titulo: item ? 'Editar no calendário' : 'Novo no calendário',
        valores: item || { tipo: est.filtro || 'gravar', status: 'a fazer', data: dataPadrao || hojeISO() },
        campos: [
          { nome: 'titulo', rotulo: 'O que é', obrigatorio: true, largo: true },
          { nome: 'marca', rotulo: 'Marca', sugestoes: marcas },
          { nome: 'data', rotulo: 'Dia', tipo: 'date', obrigatorio: true },
          { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_CAL },
          { nome: 'status', rotulo: 'Status', tipo: 'select', opcoes: [{ v: 'a fazer', t: 'A fazer' }, { v: 'feito', t: 'Feito' }] }
        ],
        aoSalvar: async (dados) => { const ok = await gravar('calendario', dados, item ? item.id : null); if (ok) desenhar(); return ok; },
        aoApagar: item ? async () => { const ok = await apagar('calendario', item.id); if (ok) desenhar(); return ok; } : null
      });
    }

    function abrirDia(iso) {
      const itens = itensDoDia(iso);
      const caixa = abrirModal(cabecaModal(dataBR(iso)) +
        '<div class="modal-corpo"><ul class="cal-itens" style="gap:4px">' + itens.map(itemHTML).join('') + '</ul></div>' +
        '<div class="modal-pe"><span class="espaco"></span><button class="btn primario" type="button" data-novo>' + icone('mais') + 'Adicionar neste dia</button></div>');
      caixa.addEventListener('click', (e) => {
        if (e.target.closest('[data-novo]')) { formItem(null, iso); return; }
        const b = e.target.closest('[data-ref]');
        if (b) abrirRef(b.dataset.ref);
      });
    }

    function abrirRef(ref) {
      const id = ref.slice(1);
      if (ref[0] === 'c') { const it = (D.calendario || []).find((x) => String(x.id) === id); if (it) formItem(it); }
      else { const c = (D.campanhas || []).find((x) => String(x.id) === id); if (c) formCampanha(c); }
    }

    $('#cal-ant').addEventListener('click', () => { est.mes--; if (est.mes < 0) { est.mes = 11; est.ano--; } desenhar(); });
    $('#cal-prox').addEventListener('click', () => { est.mes++; if (est.mes > 11) { est.mes = 0; est.ano++; } desenhar(); });
    $('#cal-hoje').addEventListener('click', () => { const d = new Date(); est.ano = d.getFullYear(); est.mes = d.getMonth(); desenhar(); });
    $('#cal-filtro').addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) { est.filtro = c.dataset.v; desenhar(); } });
    $('#cal-add').addEventListener('click', () => formItem());
    $('#cal-grade').addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) { formItem(null, add.dataset.add); return; }
      const mais = e.target.closest('[data-dia-mais]');
      if (mais) { abrirDia(mais.dataset.diaMais); return; }
      const ref = e.target.closest('[data-ref]');
      if (ref) { abrirRef(ref.dataset.ref); return; }
      const dia = e.target.closest('.cal-dia');
      if (dia) formItem(null, dia.dataset.dia);
    });
    $('#cal-atras').addEventListener('click', async (e) => {
      const f = e.target.closest('[data-feito]');
      if (f) { f.disabled = true; if (await gravar('calendario', { status: 'feito' }, num(f.dataset.feito))) { toast('Marcado como feito'); desenhar(); } else f.disabled = false; return; }
      const c = e.target.closest('[data-camp]');
      if (c) abrirRef('p' + c.dataset.camp);
    });

    desenhos.calendario = desenhar;
    desenhar();
  }

  /* =====================================================================
     ABA 4. CAMPANHAS
     ===================================================================== */
  const STATUS = ['Briefing', 'Roteiro', 'Aprovação Roteiro', 'Gravação', 'Edição', 'Aprovado', 'Entregue'];
  const COR_STATUS = { 'Briefing': 'c-cinza', 'Roteiro': 'c-azul', 'Aprovação Roteiro': 'c-roxo', 'Gravação': 'c-laranja', 'Edição': 'c-amarelo', 'Aprovado': 'c-ciano', 'Entregue': 'c-verde' };
  const COR_TIPO = { 'Conteúdo': 'c-ouro', 'Publicidade': 'c-vermelho' };

  function formCampanha(c, depoisDeSalvar) {
    const clientes = [...new Set((D.campanhas || []).map((x) => x.cliente).concat((D.marcas || []).map((m) => m.nome)).filter(Boolean))];
    formulario({
      titulo: c ? 'Editar campanha' : 'Nova campanha',
      valores: c || { tipo: 'Conteúdo', status: 'Briefing', qtd: 1, valor: 0, pagamento: 'pendente', ativa: true, favorita: false },
      campos: [
        { nome: 'campanha', rotulo: 'Campanha', obrigatorio: true, largo: true },
        { nome: 'cliente', rotulo: 'Cliente', sugestoes: clientes },
        { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: ['Conteúdo', 'Publicidade'] },
        { nome: 'status', rotulo: 'Status', tipo: 'select', opcoes: STATUS },
        { nome: 'prazo', rotulo: 'Prazo', tipo: 'date' },
        { nome: 'qtd', rotulo: 'Quantidade de vídeos', tipo: 'number' },
        { nome: 'valor', rotulo: 'Valor total (R$)', tipo: 'number', passo: '0.01' },
        { nome: 'pagamento', rotulo: 'Pagamento', tipo: 'select', opcoes: [{ v: 'pendente', t: 'Pendente' }, { v: 'pago', t: 'Pago' }] },
        { nome: 'ativa', rotulo: 'Campanha ativa', tipo: 'checkbox' },
        { nome: 'favorita', rotulo: 'Destacar com estrela', tipo: 'checkbox' }
      ],
      aoSalvar: async (dados) => {
        dados.qtd = Math.round(num(dados.qtd));
        const ok = await gravar('campanhas', dados, c ? c.id : null);
        if (ok) redesenhar();
        return ok;
      },
      aoApagar: c ? async () => { const ok = await apagar('campanhas', c.id); if (ok) redesenhar(); return ok; } : null
    });
  }

  function avisoPrazo(c) {
    if (!c.prazo || c.status === 'Entregue') return '';
    const dias = diasEntre(hojeISO(), c.prazo);
    if (dias < 0) return '<span class="etiqueta atraso">atrasado ' + (-dias) + ' ' + plural(-dias, 'dia', 'dias') + '</span>';
    if (dias === 0) return '<span class="etiqueta perto">vence hoje</span>';
    if (dias <= 3) return '<span class="etiqueta perto">vence em ' + dias + ' ' + plural(dias, 'dia', 'dias') + '</span>';
    return '';
  }

  async function abaCampanhas(sec) {
    const est = { filtro: 'todas', busca: '', col: 'prazo', dir: 1 };
    const COLUNAS = [
      { k: 'favorita', t: 'Estrela', rot: '<span class="sr-only">Estrela</span>' + icone('estrela') },
      { k: 'campanha', t: 'Campanha' }, { k: 'cliente', t: 'Cliente' }, { k: 'tipo', t: 'Tipo' }, { k: 'status', t: 'Status' },
      { k: 'qtd', t: 'Qtd', num: true }, { k: 'valor', t: 'Valor', num: true }, { k: 'prazo', t: 'Prazo' }, { k: 'pagamento', t: 'Pagamento' }
    ];
    const valorOrdem = {
      favorita: (c) => (c.favorita ? 0 : 1),
      status: (c) => { const i = STATUS.indexOf(c.status); return i < 0 ? 99 : i; },
      qtd: (c) => num(c.qtd),
      valor: (c) => num(c.valor),
      pagamento: (c) => (c.pagamento === 'pago' ? 1 : 0)
    };

    sec.innerHTML =
      '<div class="faixa-numeros" id="cp-numeros" style="--n:4"></div>' +
      '<div class="barra">' +
        '<div class="chips" role="group" aria-label="Filtrar campanhas" id="cp-filtro">' +
          '<button class="chip" type="button" data-v="todas">Todas</button><button class="chip" type="button" data-v="ativas">Ativas</button><button class="chip" type="button" data-v="finalizadas">Finalizadas</button>' +
        '</div>' +
        '<label class="busca"><span class="sr-only">Buscar</span>' + icone('lupa') + '<input type="search" id="cp-busca" placeholder="Buscar campanha ou cliente"></label>' +
        '<span class="espaco"></span>' +
        '<button class="btn" type="button" id="cp-csv">' + icone('baixar') + 'Baixar CSV</button>' +
        '<button class="btn primario" type="button" id="cp-add">' + icone('mais') + 'Nova campanha</button>' +
      '</div><div class="bloco" id="cp-tabela"></div>';

    await carregar('campanhas');

    const filtradas = () => {
      const b = semAcento(est.busca.trim());
      const lista = (D.campanhas || [])
        .filter((c) => est.filtro === 'todas' || (est.filtro === 'ativas' ? c.ativa !== false : c.ativa === false))
        .filter((c) => !b || semAcento(c.campanha).includes(b) || semAcento(c.cliente).includes(b));
      const k = est.col, dir = est.dir;
      return lista.sort((a, b2) => {
        let r;
        if (k === 'prazo') {
          if (!a.prazo && !b2.prazo) r = 0;
          else if (!a.prazo) return 1; /* sem prazo sempre no fim */
          else if (!b2.prazo) return -1;
          else r = String(a.prazo) < String(b2.prazo) ? -1 : String(a.prazo) > String(b2.prazo) ? 1 : 0;
        } else if (valorOrdem[k]) r = valorOrdem[k](a) - valorOrdem[k](b2);
        else r = comparaTexto(a[k], b2[k]);
        return r * dir || num(a.id) - num(b2.id);
      });
    };

    function desenhar() {
      const todas = D.campanhas || [];
      const ativas = todas.filter((c) => c.ativa !== false).length;
      const totalValor = todas.reduce((s, c) => s + num(c.valor), 0);
      const totalQtd = todas.reduce((s, c) => s + num(c.qtd), 0);
      const aReceber = todas.filter((c) => c.pagamento !== 'pago').reduce((s, c) => s + num(c.valor), 0);
      const recebido = todas.filter((c) => c.pagamento === 'pago').reduce((s, c) => s + num(c.valor), 0);
      $('#cp-numeros').innerHTML =
        caixaNumero('Total de campanhas', inteiro(todas.length)) +
        caixaNumero('Ativas', inteiro(ativas)) +
        caixaNumero('Valor total', moeda(totalValor), totalQtd > 0 ? 'ticket médio de ' + moeda(totalValor / totalQtd) + ' por vídeo' : 'ticket médio aparece quando tiver vídeos') +
        caixaNumero('A receber', moeda(aReceber), 'já recebido ' + moeda(recebido));

      $$('#cp-filtro .chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.v === est.filtro)));

      const caixa = $('#cp-tabela');
      if (falhou.campanhas) { caixa.innerHTML = '<p class="vazio">Não deu pra carregar as campanhas. Veja o aviso no topo da página.</p>'; return; }
      if (!todas.length) { caixa.innerHTML = '<p class="vazio">Nenhuma campanha ainda. Clique em "Nova campanha" pra cadastrar a primeira.</p>'; return; }
      const lista = filtradas();
      const cab = COLUNAS.map((c) => {
        const ativa = est.col === c.k;
        const sort = ativa ? (est.dir === 1 ? 'ascending' : 'descending') : 'none';
        return '<th' + (c.num ? ' class="num"' : '') + ' aria-sort="' + sort + '"><button class="ord" type="button" data-col="' + c.k + '" title="Ordenar por ' + c.t.toLowerCase() + '">' +
          (c.rot || esc(c.t)) + '<span class="seta">' + icone(ativa ? (est.dir === 1 ? 'cima' : 'baixo') : 'ambos') + '</span></button></th>';
      }).join('');
      caixa.innerHTML = '<div class="rolagem"><table class="tabela"><thead><tr>' + cab + '</tr></thead><tbody>' +
        (lista.length ? lista.map((c) =>
          '<tr class="clicavel' + (c.favorita ? ' estrelada' : '') + (c.ativa === false ? ' apagado' : '') + '" data-id="' + c.id + '" tabindex="0">' +
          '<td class="acoes"><button class="icone-btn estrela' + (c.favorita ? ' ligado' : '') + '" type="button" data-estrela aria-pressed="' + !!c.favorita + '" aria-label="' + (c.favorita ? 'Tirar destaque' : 'Destacar') + '">' + icone('estrela') + '</button></td>' +
          '<td>' + esc(c.campanha || 'Sem nome') + '</td>' +
          '<td class="nw">' + esc(c.cliente) + '</td>' +
          '<td><span class="pilula sem-ponto ' + (COR_TIPO[c.tipo] || 'c-cinza') + '">' + esc(c.tipo) + '</span></td>' +
          '<td><span class="pilula ' + (COR_STATUS[c.status] || 'c-cinza') + '">' + esc(c.status) + '</span></td>' +
          '<td class="num">' + inteiro(c.qtd) + '</td>' +
          '<td class="num">' + moeda(c.valor) + '</td>' +
          '<td class="nw">' + (dataBR(c.prazo) || '<span class="sub-linha">sem prazo</span>') + avisoPrazo(c) + '</td>' +
          '<td><span class="pilula ' + (c.pagamento === 'pago' ? 'c-verde' : 'c-amarelo') + '">' + (c.pagamento === 'pago' ? 'Pago' : 'Pendente') + '</span></td>' +
          '</tr>').join('')
        : '<tr><td colspan="9" class="vazio">Nenhuma campanha com esse filtro.</td></tr>') +
        '</tbody></table></div>';
    }

    $('#cp-filtro').addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) { est.filtro = c.dataset.v; desenhar(); } });
    $('#cp-busca').addEventListener('input', (e) => { est.busca = e.target.value; desenhar(); });
    $('#cp-add').addEventListener('click', () => formCampanha());
    $('#cp-csv').addEventListener('click', () => {
      baixarCSV('campanhas', ['Favorita', 'Campanha', 'Cliente', 'Tipo', 'Status', 'Qtd', 'Valor', 'Prazo', 'Pagamento', 'Ativa'],
        filtradas().map((c) => [c.favorita ? 'sim' : '', c.campanha, c.cliente, c.tipo, c.status, num(c.qtd), num(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), dataBR(c.prazo), c.pagamento === 'pago' ? 'Pago' : 'Pendente', c.ativa === false ? 'não' : 'sim']));
    });
    $('#cp-tabela').addEventListener('click', async (e) => {
      const ord = e.target.closest('[data-col]');
      if (ord) {
        if (est.col === ord.dataset.col) est.dir = -est.dir; else { est.col = ord.dataset.col; est.dir = 1; }
        desenhar();
        const novo = $('#cp-tabela [data-col="' + est.col + '"]'); if (novo) novo.focus();
        return;
      }
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const c = (D.campanhas || []).find((x) => String(x.id) === tr.dataset.id);
      if (!c) return;
      if (e.target.closest('[data-estrela]')) {
        const ok = await gravar('campanhas', { favorita: !c.favorita }, c.id);
        if (ok) desenhar();
        return;
      }
      formCampanha(c);
    });
    $('#cp-tabela').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !e.target.matches('tr[data-id]')) return;
      const c = (D.campanhas || []).find((x) => String(x.id) === e.target.dataset.id);
      if (c) formCampanha(c);
    });

    desenhos.campanhas = desenhar;
    desenhar();
  }

  /* =====================================================================
     ABA 5. CHECKLIST PORTFÓLIO
     Todo o conteúdo vem do arquivo js/biblioteca.js, sem mudar nada.
     ===================================================================== */
  const COR_REF = { coral: '#E07A5F', rosa: '#C97B8E', mostarda: '#C9A54C', oliva: '#7F8C55', terra: '#A0603A', areia: '#B7A57A' };

  async function abaChecklist(sec) {
    const B = window.Biblioteca;
    if (!B) {
      sec.innerHTML = '<div class="falha-aba">Não encontrei o arquivo js/biblioteca.js. Confira se ele está na pasta js do projeto.</div>';
      return;
    }
    const CHECK = B.CHECKLIST || [], REFS = B.REFERENCIAS || [], TIPOS = B.TIPOS || [], NICHOS = B.NICHOS || [], REV = B.REVISAO || [], COMO = B.COMO_USAR || [];
    const SUBS = [
      { k: 'checklist', t: 'Checklist do portfólio' },
      { k: 'referencias', t: 'Referências de vídeo' },
      { k: 'roteiros', t: 'Roteiros' },
      { k: 'nichos', t: 'Ideias por nicho' },
      { k: 'revisar', t: 'Revisar meu roteiro' }
    ];
    let sub = 'checklist';
    let filtroEstilo = '';
    let semSalvar = false;

    sec.innerHTML = '<div class="sub-abas" role="tablist">' +
      SUBS.map((s) => '<button class="sub-aba" type="button" role="tab" data-sub="' + s.k + '" aria-selected="false">' + s.t + '</button>').join('') +
      '</div><div id="ck-corpo"></div>';

    await carregar('marcados');
    if (falhou.marcados) semSalvar = true;
    const marcados = {};
    (D.marcados || []).forEach((m) => { if (m.marcado) marcados[m.chave] = true; });

    async function marcar(chave, valor) {
      if (valor) marcados[chave] = true; else delete marcados[chave];
      if (semSalvar) { toast('Marcado só nesta tela. Falta a tabela "marcados" pra ficar salvo.', true); return; }
      try {
        const { error } = await db.from('marcados').upsert({ chave: chave, marcado: valor, atualizado_em: new Date().toISOString() }, { onConflict: 'chave' });
        if (error) { const m = explicarErro(error, 'marcados'); toast(m, true); avisar(m); }
      } catch (e) { toast(explicarErro(e, 'marcados'), true); }
    }

    const chaveCheck = (s, i) => 'checklist:' + s.id + ':' + i;
    const chaveRev = (b, i) => 'revisao:' + b + ':' + i;
    const barra = (feitos, total) => '<span class="progresso"><i style="width:' + pct(feitos, total) + '%"></i></span>';

    /* --- sub-aba 1: checklist --- */
    function telaChecklist() {
      const total = CHECK.reduce((s, x) => s + (x.itens || []).length, 0);
      const feitos = CHECK.reduce((s, x) => s + (x.itens || []).filter((_, i) => marcados[chaveCheck(x, i)]).length, 0);
      return '<div class="prog-geral"><div class="prog-linha"><b>' + pct(feitos, total) + '% pronto</b>' + barra(feitos, total) + '<span>' + feitos + ' de ' + total + ' itens</span></div></div>' +
        CHECK.map((s) => {
          const itens = s.itens || [];
          const f = itens.filter((_, i) => marcados[chaveCheck(s, i)]).length;
          return '<details class="sanfona" data-secao="' + esc(s.id) + '"><summary>' +
            '<span class="emoji" aria-hidden="true">' + esc(s.emoji) + '</span>' +
            '<span class="cab"><b>' + esc(s.nome) + '</b><small>' + esc(s.resumo) + '</small></span>' +
            '<span class="lado">' + barra(f, itens.length) + '<span>' + f + '/' + itens.length + '</span></span>' +
            '<span class="seta-s">' + icone('dir') + '</span></summary>' +
            '<div class="sanfona-corpo"><p class="porque">' + htmlSeguro(s.porque) + '</p><ul class="itens-check">' +
            itens.map((it, i) => '<li><label><input type="checkbox" data-chave="' + esc(chaveCheck(s, i)) + '"' + (marcados[chaveCheck(s, i)] ? ' checked' : '') + '>' +
              '<span><span class="t">' + htmlSeguro(it.t) + '</span><span class="d">' + htmlSeguro(it.d) + '</span></span></label></li>').join('') +
            '</ul></div></details>';
        }).join('');
    }

    /* --- sub-aba 2: referências --- */
    function telaReferencias() {
      const estilos = B.ESTILOS || [...new Set(REFS.map((r) => r.estilo))];
      const lista = REFS.filter((r) => !filtroEstilo || r.estilo === filtroEstilo);
      return '<div class="barra"><div class="chips" role="group" aria-label="Filtrar por estilo" id="ck-estilos">' +
        '<button class="chip" type="button" data-estilo="" aria-pressed="' + (!filtroEstilo) + '">Todos</button>' +
        estilos.filter((e) => REFS.some((r) => r.estilo === e)).map((e) => '<button class="chip" type="button" data-estilo="' + esc(e) + '" aria-pressed="' + (filtroEstilo === e) + '">' + esc(e) + '</button>').join('') +
        '</div></div><div class="refs">' +
        lista.map((r) => '<button class="ref" type="button" data-ref="' + esc(r.id) + '">' +
          '<span class="ref-capa" style="--rc:' + (COR_REF[r.cor] || '#555') + '"><span class="emoji" aria-hidden="true">' + esc(r.emoji) + '</span><span class="dur">' + esc(r.duracao) + '</span></span>' +
          '<span class="ref-corpo"><b>' + esc(r.titulo) + '</b><small>' + esc(r.estilo) + ' · ' + esc(r.duracao) + '</small><small>' + esc(r.marca) + '</small></span></button>').join('') +
        '</div>';
    }

    function fichaReferencia(r) {
      const aud = (B.AUDIENCIAS || []).find((a) => a.v === r.audiencia);
      const caixa = abrirModal(cabecaModal(r.emoji + ' ' + r.titulo) +
        '<div class="modal-corpo">' +
          '<div class="ficha-meta"><span class="pilula sem-ponto c-ouro">' + esc(r.estilo) + '</span><span class="pilula sem-ponto c-cinza">' + esc(r.duracao) + '</span>' +
          (r.marca ? '<span class="pilula sem-ponto c-cinza">' + esc(r.marca) + '</span>' : '') +
          (aud ? '<span class="pilula sem-ponto c-cinza">' + esc(aud.t) + '</span>' : '') + '</div>' +
          '<p class="rotulo-peq" style="margin-top:0">Gancho</p><p class="ficha-gancho">' + htmlSeguro(r.gancho) + '</p>' +
          '<p class="rotulo-peq">Por que funciona</p><p class="ficha-txt">' + htmlSeguro(r.porque) + '</p>' +
          '<p class="rotulo-peq">O diferencial</p><p class="ficha-txt">' + htmlSeguro(r.diferencial) + '</p>' +
          '<p class="rotulo-peq">O erro comum</p><p class="ficha-txt">' + htmlSeguro(r.erro) + '</p>' +
          '<p class="rotulo-peq">Roteiro</p><ul class="blocos-tempo">' + (r.roteiro || []).map((b) => '<li><span class="tempo">' + esc(b.t) + '</span><span>' + htmlSeguro(b.o) + '</span></li>').join('') + '</ul>' +
        '</div>' +
        '<div class="modal-pe"><span class="espaco"></span>' + (r.youtube ? '<a class="btn primario" href="' + esc(r.youtube) + '" target="_blank" rel="noopener">' + icone('play') + 'Assistir</a>' : '') + '</div>', true);
      return caixa;
    }

    /* --- sub-aba 3: roteiros --- */
    function telaRoteiros() {
      return TIPOS.map((t) => '<details class="sanfona"><summary>' +
        '<span class="emoji" aria-hidden="true">' + esc(t.emoji) + '</span>' +
        '<span class="cab"><b>' + esc(t.nome) + '</b><small>' + esc(t.duracao) + '</small></span>' +
        '<span class="seta-s">' + icone('dir') + '</span></summary>' +
        '<div class="sanfona-corpo">' +
          '<p class="rotulo-peq" style="margin-top:0">Quando usar</p><p class="porque">' + htmlSeguro(t.porque) + '</p>' +
          '<p class="rotulo-peq">Blocos de tempo</p><ul class="blocos-tempo">' + (t.beats || []).map((b) => '<li><span class="tempo">' + esc(b.t) + '</span><span>' + htmlSeguro(b.o) + '</span></li>').join('') + '</ul>' +
          ((t.erros || []).length ? '<p class="rotulo-peq">Erros comuns</p><ul class="lista-erros">' + t.erros.map((e) => '<li>' + htmlSeguro(e) + '</li>').join('') + '</ul>' : '') +
        '</div></details>').join('');
    }

    /* --- sub-aba 4: ideias por nicho --- */
    function telaNichos() {
      return (COMO.length ? '<p class="rotulo-peq" style="margin-top:0">Como usar os ganchos</p><ul class="como-usar">' + COMO.map((c) => '<li>' + htmlSeguro(c) + '</li>').join('') + '</ul>' : '') +
        '<div class="nichos">' + NICHOS.map((n) => '<div class="nicho"><h3><span aria-hidden="true">' + esc(n.emoji) + '</span>' + esc(n.nome) + '</h3><ul>' +
          (n.ideias || []).map((i) => '<li><b>' + htmlSeguro(i.t) + '</b><span>' + htmlSeguro(i.gancho) + '</span></li>').join('') + '</ul></div>').join('') + '</div>';
    }

    /* --- sub-aba 5: revisar roteiro --- */
    let rascunho = '';
    try { rascunho = localStorage.getItem('painel-roteiro') || ''; } catch (e) { /* sem rascunho */ }
    function contas(txt) {
      const palavras = (txt.trim().match(/\S+/g) || []).length;
      const seg = Math.round(palavras / 2.5);
      return palavras + ' ' + plural(palavras, 'palavra', 'palavras') + ' · cerca de ' + seg + ' ' + plural(seg, 'segundo', 'segundos') + ' falando';
    }
    function telaRevisar() {
      const total = REV.reduce((s, b) => s + (b.itens || []).length, 0);
      const feitos = REV.reduce((s, b, bi) => s + (b.itens || []).filter((_, i) => marcados[chaveRev(bi, i)]).length, 0);
      return '<div class="revisar"><div><label class="campo"><span>Cole o seu roteiro aqui</span><textarea id="ck-roteiro" placeholder="Cole o roteiro e vá conferindo os itens ao lado.">' + esc(rascunho) + '</textarea></label>' +
        '<div class="contas" id="ck-contas">' + contas(rascunho) + '</div></div>' +
        '<div><div class="prog-geral"><div class="prog-linha"><b>' + feitos + ' de ' + total + ' conferidos</b>' + barra(feitos, total) +
        '<button class="btn" type="button" id="ck-limpar">Começar revisão nova</button></div></div>' +
        REV.map((b, bi) => '<details class="sanfona" open><summary><span class="emoji" aria-hidden="true">' + esc(b.emoji) + '</span><span class="cab"><b>' + esc(b.bloco) + '</b></span><span class="seta-s">' + icone('dir') + '</span></summary>' +
          '<div class="sanfona-corpo"><ul class="itens-check">' + (b.itens || []).map((it, i) =>
            '<li><label><input type="checkbox" data-chave="' + chaveRev(bi, i) + '"' + (marcados[chaveRev(bi, i)] ? ' checked' : '') + '>' +
            '<span><span class="t">' + htmlSeguro(it.t) + '</span><span class="d">' + htmlSeguro(it.d) + '</span></span></label></li>').join('') +
          '</ul></div></details>').join('') + '</div></div>';
    }

    const TELAS = { checklist: telaChecklist, referencias: telaReferencias, roteiros: telaRoteiros, nichos: telaNichos, revisar: telaRevisar };

    function desenhar() {
      $$('.sub-aba', sec).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.sub === sub)));
      const corpo = $('#ck-corpo');
      const abertos = $$('details[open][data-secao]', corpo).map((d) => d.dataset.secao);
      corpo.innerHTML = TELAS[sub]();
      abertos.forEach((id) => { const d = corpo.querySelector('details[data-secao="' + id + '"]'); if (d) d.open = true; });
    }

    sec.querySelector('.sub-abas').addEventListener('click', (e) => { const b = e.target.closest('.sub-aba'); if (b) { sub = b.dataset.sub; desenhar(); } });
    const corpo = $('#ck-corpo');
    corpo.addEventListener('change', async (e) => {
      const ch = e.target.closest('input[data-chave]');
      if (!ch) return;
      await marcar(ch.dataset.chave, ch.checked);
      /* atualiza as barrinhas sem fechar as seções abertas */
      const pos = window.scrollY;
      desenhar();
      window.scrollTo(0, pos);
    });
    corpo.addEventListener('click', async (e) => {
      const r = e.target.closest('.ref');
      if (r) { const ref = REFS.find((x) => x.id === r.dataset.ref); if (ref) fichaReferencia(ref); return; }
      const est = e.target.closest('[data-estilo]');
      if (est) { filtroEstilo = est.dataset.estilo; desenhar(); return; }
      if (e.target.closest('#ck-limpar')) {
        const chaves = Object.keys(marcados).filter((k) => k.indexOf('revisao:') === 0);
        for (const k of chaves) await marcar(k, false);
        desenhar();
        toast('Revisão zerada');
      }
    });
    corpo.addEventListener('input', (e) => {
      if (e.target.id !== 'ck-roteiro') return;
      rascunho = e.target.value;
      try { localStorage.setItem('painel-roteiro', rascunho); } catch (err) { /* segue */ }
      $('#ck-contas').textContent = contas(rascunho);
    });

    desenhar();
  }
})();
