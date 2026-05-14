/**
 * Agro Vision — logica de interfaz, guia JSON y diagnostico de demostracion.
 */

const CROP_THUMB = {
    cacao: 'cacao/buencacao/buenoOIP (4.1).jpg',
    cafe: 'cafe/buencafe/buenocOIP (4.1).jpg',
    yuca: 'yuca/buenayuca/buenoyOIP (4.1).jpg',
    platano: 'platano/buenplatano/buenopOIP (4.1).jpg'
};

const GUIDE_DESC = {
    cacao: 'Principal exportacion de Guinea Ecuatorial',
    cafe: 'Cultivo tradicional en Bioko',
    yuca: 'Seguridad alimentaria local',
    platano: 'Consumo local principal'
};

const languages = {
    es: { code: 'ES', name: 'Espanol', native: 'Espanol', available: true },
    fr: { code: 'FR', name: 'Francais', native: 'Francais', available: true },
    fang: { code: 'FG', name: 'Fang', native: 'Fang', available: true },
    picchi: { code: 'PC', name: 'Picchi', native: 'Picchi', available: true },
    bubi: { code: 'BB', name: 'Bubi', native: 'Bubi', available: false },
    combe: { code: 'CB', name: 'Combe', native: 'Combe', available: false },
    fadambo: { code: 'FD', name: 'Fadambo', native: 'Fadambo', available: false },
    ndowe: { code: 'ND', name: 'Ndowe', native: 'Ndowe', available: false },
    bisio: { code: 'BS', name: 'Bisio', native: 'Bisio', available: false }
};

let currentLang = 'es';
let APP_DATA = null;
let lastDiagnosis = null;

function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function hashPick(str, mod) {
    let h = 0;
    const n = Math.min(String(str).length, 900);
    for (let i = 0; i < n; i++) h = ((h << 5) - h) + String(str).charCodeAt(i) | 0;
    return Math.abs(h) % Math.max(mod, 1);
}

function flatDiseases() {
    const out = [];
    if (!APP_DATA || !APP_DATA.cultivos) return out;
    Object.entries(APP_DATA.cultivos).forEach(([cropKey, crop]) => {
        (crop.enfermedades || []).forEach((enfermedad) => {
            out.push({ cropKey, cropNombre: crop.nombre, enfermedad });
        });
    });
    return out;
}

function urgencyToRiskClass(u) {
    if (u === 'muy_alta' || u === 'alta') return 'high';
    if (u === 'media') return 'medium';
    return 'low';
}

function urgencyLabel(u) {
    return { muy_alta: 'Muy alta', alta: 'Alta', media: 'Media', baja: 'Baja' }[u] || String(u || '');
}

function urgencyAlertMessage(u) {
    const map = {
        muy_alta: 'Riesgo critico: intervenga de inmediato para limitar propagacion y perdidas.',
        alta: 'Riesgo alto: priorice el tratamiento y el seguimiento en los proximos dias.',
        media: 'Riesgo moderado: vigile el lote y aplique las medidas recomendadas.',
        baja: 'Riesgo bajo o controlable: mantenga buenas practicas preventivas.'
    };
    return map[u] || map.media;
}

function tipoLabel(tipo) {
    const t = (tipo || '').toLowerCase();
    const map = { enfermedad: 'Enfermedad fungica/bacteriana', virus: 'Virus', bacteria: 'Infeccion bacteriana', plaga: 'Plaga de insecto' };
    return map[t] || (tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : '');
}

function pickDiagnosisFromImageDataUrl(dataUrl) {
    const flat = flatDiseases();
    if (!flat.length) return null;
    return flat[hashPick(dataUrl, flat.length)];
}

function renderListIntoUl(elementId, items) {
    const ul = document.getElementById(elementId);
    if (!ul) return;
    ul.innerHTML = (items || []).map((t) => `<li><span class="bullet"></span>${escapeHtml(t)}</li>`).join('');
}

function applyDiagnosisToResult(pick) {
    if (!pick) return;
    lastDiagnosis = pick;
    const e = pick.enfermedad;
    const cropKey = pick.cropKey;
    const cropNombre = pick.cropNombre;

    const imgSrc = document.getElementById('result-img').src;
    const conf = 62 + hashPick(imgSrc, 33);

    document.getElementById('result-crop-thumb').src = CROP_THUMB[cropKey] || '';
    document.getElementById('result-crop-label').textContent = String(cropNombre || '').toUpperCase();
    document.getElementById('result-disease-title').textContent = String(e.nombre || '').toUpperCase();
    document.getElementById('result-disease-type').textContent = tipoLabel(e.tipo);
    document.getElementById('result-scientific').textContent = e.nombre_cientifico || '';

    const bar = document.getElementById('confidence-bar');
    bar.style.width = '0%';
    bar.textContent = conf + '%';
    setTimeout(() => { bar.style.width = conf + '%'; }, 120);

    const urg = e.urgencia || 'media';
    const riskClass = urgencyToRiskClass(urg);
    const alertBox = document.getElementById('result-alert-box');
    alertBox.classList.remove('high', 'medium', 'low');
    alertBox.classList.add(riskClass);
    document.getElementById('result-alert-text').innerHTML =
        '<strong>URGENCIA: ' + escapeHtml(urgencyLabel(urg).toUpperCase()) + '</strong><br>' +
        '<span style="font-weight:500;">' + escapeHtml(urgencyAlertMessage(urg)) + '</span>';

    renderListIntoUl('result-sintomas-list', e.sintomas || []);
    renderListIntoUl('result-tratamiento-list', e.tratamiento || []);

    const consejos = (APP_DATA && APP_DATA.consejos_generales) ? APP_DATA.consejos_generales : [];
    const c1 = consejos[hashPick(imgSrc + 'a', consejos.length)] || null;
    const c2 = consejos[hashPick(imgSrc + 'b', consejos.length)] || null;
    const tips = [];
    if (c1 && c1.descripcion) tips.push(c1.titulo + ': ' + c1.descripcion);
    if (c2 && c2.descripcion && c2.id !== c1.id) tips.push(c2.titulo + ': ' + c2.descripcion);
    renderListIntoUl('result-consejos-list', tips.length ? tips : ['Consulte con un tecnico agricola local para validar el diagnostico en campo.']);
}

function renderGuideLists() {
    if (!APP_DATA || !APP_DATA.cultivos) return;

    const cultList = document.getElementById('cultivos-list');
    const plagaList = document.getElementById('plagas-list');

    cultList.innerHTML = Object.entries(APP_DATA.cultivos).map(([key, crop]) => {
        const n = (crop.enfermedades || []).length;
        const thumb = CROP_THUMB[key] || '';
        const search = `${key} ${crop.nombre}`.toLowerCase();
        return `
            <div class="guide-item" data-name="${escapeHtml(search)}" onclick="showCropDetail('${key}')">
                <img src="${thumb}" alt="${escapeHtml(crop.nombre)}">
                <div class="info">
                    <div class="title">${escapeHtml(String(crop.nombre).toUpperCase())}</div>
                    <div class="desc">${n} ficha${n === 1 ? '' : 's'} en la guia agricola</div>
                    <div class="link">Ver enfermedades y plagas &#8250;</div>
                </div>
                <span class="arrow">&#8250;</span>
            </div>`;
    }).join('');

    plagaList.innerHTML = flatDiseases().map((p) => {
        const e = p.enfermedad;
        const urg = e.urgencia || 'media';
        const rc = urgencyToRiskClass(urg);
        const riskText = urgencyLabel(urg) + ' prioridad';
        const thumb = CROP_THUMB[p.cropKey] || '';
        const search = `${e.nombre} ${e.nombre_cientifico || ''} ${p.cropNombre} ${e.tipo || ''}`.toLowerCase();
        return `
            <div class="plaga-item" data-name="${escapeHtml(search)}" data-crop="${escapeHtml(p.cropNombre.toLowerCase())}"
                 onclick="showDiseaseDetail('${p.cropKey}','${e.id}')">
                <img class="plaga-thumb" src="${thumb}" alt="">
                <div class="plaga-text">
                    <div class="plaga-name">${escapeHtml(e.nombre)}</div>
                    <div class="plaga-meta"><span class="crop">${escapeHtml(p.cropNombre)}</span> &#183; <span class="risk ${rc}">${escapeHtml(riskText)}</span></div>
                </div>
                <span class="arrow">&#8250;</span>
            </div>`;
    }).join('');
}

async function loadAppData() {
    try {
        const res = await fetch('data/enfermedades.json');
        APP_DATA = await res.json();
        renderGuideLists();
    } catch (err) {
        console.error(err);
        document.getElementById('cultivos-list').innerHTML =
            '<div style="padding:20px;color:var(--danger);">No se pudo cargar la guia. Comprueba que exista data/enfermedades.json</div>';
    }
}

function showCropDetail(cropKey) {
    if (!APP_DATA || !APP_DATA.cultivos[cropKey]) return;
    const c = APP_DATA.cultivos[cropKey];
    const thumb = CROP_THUMB[cropKey] || '';
    const diseasesHtml = (c.enfermedades || []).map((e) => `
        <button type="button" class="btn btn-outline" style="margin-bottom:10px;text-align:left;font-weight:600;line-height:1.35;"
            onclick="showDiseaseDetail('${cropKey}','${e.id}')">
            ${escapeHtml(e.nombre)}
            <span style="display:block;font-weight:500;color:var(--text-light);font-size:0.85em;margin-top:4px;">${escapeHtml(tipoLabel(e.tipo))}</span>
        </button>`).join('');

    document.getElementById('guide-detail-inner').innerHTML = `
        <div class="detail-sheet-header">
            <button type="button" class="detail-back" onclick="closeGuideDetail()">&#8592;</button>
            <h2>${escapeHtml(c.nombre)}</h2>
            <div class="detail-meta">
                <span class="detail-chip">${(c.enfermedades || []).length} fichas tecnicas</span>
                <span class="detail-chip">Guia local</span>
            </div>
        </div>
        <div class="detail-body">
            <img class="detail-hero" src="${thumb}" alt="">
            <p style="color:var(--text);font-size:0.95em;line-height:1.5;">${escapeHtml(GUIDE_DESC[cropKey] || '')}</p>
            <div class="detail-section-title">Enfermedades, virus y plagas</div>
            ${diseasesHtml}
        </div>`;
    document.getElementById('guide-detail-overlay').classList.add('active');
}

function showDiseaseDetail(cropKey, diseaseId) {
    if (!APP_DATA || !APP_DATA.cultivos[cropKey]) return;
    const c = APP_DATA.cultivos[cropKey];
    const e = (c.enfermedades || []).find((x) => x.id === diseaseId);
    if (!e) return;

    const thumb = CROP_THUMB[cropKey] || '';
    const urg = e.urgencia || 'media';
    const urgCss = ['muy_alta', 'alta', 'media', 'baja'].includes(urg) ? urg : 'media';

    document.getElementById('guide-detail-inner').innerHTML = `
        <div class="detail-sheet-header">
            <button type="button" class="detail-back" onclick="closeGuideDetail()">&#8592;</button>
            <h2>${escapeHtml(e.nombre)}</h2>
            <div class="detail-meta">
                <span class="detail-chip">${escapeHtml(c.nombre)}</span>
                <span class="detail-chip">${escapeHtml(tipoLabel(e.tipo))}</span>
            </div>
        </div>
        <div class="detail-body">
            <img class="detail-hero" src="${thumb}" alt="">
            <p style="font-style:italic;color:var(--text-light);margin-bottom:8px;">${escapeHtml(e.nombre_cientifico || '')}</p>
            <div class="detail-urgency ${urgCss}">
                Urgencia recomendada: ${escapeHtml(urgencyLabel(urg))}
            </div>
            <div class="detail-section-title">Que observar en el cultivo</div>
            <ul class="detail-list">${sintomasHtml}</ul>
            <div class="detail-section-title">Que hacer (manejo recomendado)</div>
            <ul class="detail-list">${tratHtml}</ul>
            <button type="button" class="btn btn-outline" style="margin-top:16px;" onclick="showCropDetail('${cropKey}')">Volver a ${escapeHtml(c.nombre)}</button>
        </div>`;
    document.getElementById('guide-detail-overlay').classList.add('active');
}

function closeGuideDetail(ev) {
    if (ev && ev.target !== ev.currentTarget) return;
    document.getElementById('guide-detail-overlay').classList.remove('active');
}

function showScreen(screenId) {
    document.getElementById('guide-detail-overlay').classList.remove('active');
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const el = document.getElementById(screenId);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
}

function selectWelcomeLang(btn) {
    const lang = btn.dataset.lang;
    if (!languages[lang].available) {
        showLangToast();
        return;
    }
    document.querySelectorAll('.lang-btn-welcome').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentLang = lang;
}

function enterApp() {
    updateLangLabels();
    showScreen('screen-home');
}

function showLangToast() {
    document.getElementById('lang-toast').classList.add('active');
}

function closeLangToast(e) {
    if (!e || e.target === document.getElementById('lang-toast')) {
        document.getElementById('lang-toast').classList.remove('active');
    }
}

function openLangModal() {
    const list = document.getElementById('lang-list');
    list.innerHTML = '';
    Object.entries(languages).forEach(([key, lang]) => {
        const div = document.createElement('div');
        div.className = 'lang-option';
        if (lang.available) {
            div.onclick = () => { changeLang(key); };
        } else {
            div.onclick = () => { showLangToast(); };
            div.style.opacity = '0.6';
        }
        div.innerHTML = `
            <div>
                <div class="lang-name">${lang.name}</div>
                <div class="lang-native">${lang.native}</div>
            </div>
            ${lang.available
                ? `<span class="check" style="${key === currentLang ? '' : 'visibility:hidden'}">&#10003;</span>`
                : '<span class="badge-soon">PRONTO</span>'}`;
        list.appendChild(div);
    });
    document.getElementById('lang-modal').classList.add('active');
}

function closeLangModal(e) {
    if (!e || e.target === document.getElementById('lang-modal')) {
        document.getElementById('lang-modal').classList.remove('active');
    }
}

function changeLang(lang) {
    currentLang = lang;
    updateLangLabels();
    closeLangModal();
    document.querySelectorAll('.lang-btn-welcome').forEach((b) => {
        b.classList.toggle('active', b.dataset.lang === lang);
    });
}

function updateLangLabels() {
    const label = languages[currentLang].code;
    ['current-lang-label', 'current-lang-label-diag', 'current-lang-label-res', 'current-lang-label-cli', 'current-lang-label-guide'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = label;
    });
}

function selectCrop(element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.crop-item').forEach((c) => c.classList.remove('selected'));
    element.classList.add('selected');
}

function handleImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('preview-img').src = e.target.result;
            document.getElementById('preview-area').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function analyze() {
    showScreen('screen-result');
    document.getElementById('loading-area').classList.remove('hidden');
    document.getElementById('result-content').classList.add('hidden');

    setTimeout(() => {
        document.getElementById('loading-area').classList.add('hidden');
        document.getElementById('result-content').classList.remove('hidden');
        const previewSrc = document.getElementById('preview-img').src;
        document.getElementById('result-img').src = previewSrc;
        const pick = pickDiagnosisFromImageDataUrl(previewSrc);
        if (pick) applyDiagnosisToResult(pick);
        else {
            lastDiagnosis = null;
            document.getElementById('result-disease-title').textContent = 'SIN DATOS';
        }
    }, 2200);
}

function showResultDemo() {
    showScreen('screen-result');
    document.getElementById('loading-area').classList.add('hidden');
    document.getElementById('result-content').classList.remove('hidden');
    const flat = flatDiseases();
    const pick = flat[hashPick(String(Date.now()), flat.length)] || flat[0];
    document.getElementById('result-img').src = CROP_THUMB[pick.cropKey] || '';
    if (pick) applyDiagnosisToResult(pick);
}

let isSpeaking = false;

function speakResult() {
    const btn = document.getElementById('voice-btn');
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        btn.classList.remove('speaking');
        return;
    }
    if (!lastDiagnosis) {
        alert('No hay un analisis cargado.');
        return;
    }
    const e = lastDiagnosis.enfermedad;
    const crop = lastDiagnosis.cropNombre;
    const text = [
        'Cultivo identificado: ' + crop + '.',
        'Problema: ' + e.nombre + '.',
        e.nombre_cientifico ? 'Nombre cientifico: ' + e.nombre_cientifico + '.' : '',
        'Urgencia: ' + urgencyLabel(e.urgencia) + '.',
        'Signos clave: ' + (e.sintomas || []).slice(0, 3).join(' '),
        'Tratamiento sugerido: ' + (e.tratamiento || []).slice(0, 4).join(' ')
    ].filter(Boolean).join(' ');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang === 'fr' ? 'fr-FR' : 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => { isSpeaking = true; btn.classList.add('speaking'); };
    utterance.onend = () => { isSpeaking = false; btn.classList.remove('speaking'); };
    utterance.onerror = () => {
        isSpeaking = false;
        btn.classList.remove('speaking');
        alert('No se pudo reproducir la voz.');
    };
    window.speechSynthesis.speak(utterance);
}

const YIELD_BASE = { cacao: 820, cafe: 680, yuca: 14000, platano: 18500 };

function calculateYield() {
    const soil = document.getElementById('soil-type').value;
    const season = document.getElementById('season').value;
    const hectares = document.getElementById('hectares').value;
    const month = document.getElementById('harvest-month').value;
    const unit = document.getElementById('unit').value;

    if (!soil) { alert('Por favor selecciona el tipo de suelo'); return; }
    if (!season) { alert('Por favor selecciona la epoca del ano'); return; }
    if (!hectares || hectares <= 0) { alert('Por favor ingresa el tamano de la finca'); return; }

    const soilNames = {
        franco: 'Franco', arcilloso: 'Arcilloso', arenoso: 'Arenoso',
        limoso: 'Limoso', volcanico: 'Volcanico', rojo: 'Rojo ferralitico', humedo: 'Humedo organico'
    };
    const seasonNames = { seca: 'Seca', lluviosa: 'Lluviosa' };

    const selected = document.querySelector('#screen-climate .crop-item.selected');
    const cropKey = selected && selected.dataset.crop ? selected.dataset.crop : 'cacao';
    const cropLabel = APP_DATA && APP_DATA.cultivos[cropKey] ? APP_DATA.cultivos[cropKey].nombre : cropKey;

    document.getElementById('res-crop').textContent = cropLabel;
    document.getElementById('res-month').textContent = month;
    document.getElementById('res-season').textContent = seasonNames[season];
    document.getElementById('res-soil').textContent = soilNames[soil] || soil;
    document.getElementById('res-size').textContent = hectares + ' ' + (unit === 'ha' ? 'ha' : unit);

    const base = YIELD_BASE[cropKey] || 800;
    const soilFactor = { franco: 1, arcilloso: 0.92, arenoso: 0.88, limoso: 0.95, volcanico: 1.05, rojo: 0.9, humedo: 0.93 }[soil] || 1;
    const seasonFactor = season === 'lluviosa' ? 1.02 : 0.96;
    const yieldPerHa = Math.round(base * soilFactor * seasonFactor);
    const total = (yieldPerHa * parseFloat(hectares)).toLocaleString('es-ES');
    document.querySelector('#yield-result .yield-value').textContent =
        cropKey === 'yuca' ? yieldPerHa.toLocaleString('es-ES') + ' kg/ha' : yieldPerHa + ' kg/ha';
    document.getElementById('res-total').textContent = total + ' kg';

    const thumb = document.getElementById('yield-crop-thumb');
    if (thumb) thumb.src = CROP_THUMB[cropKey] || thumb.src;

    const pot = Math.round(58 + soilFactor * seasonFactor * 22);
    document.getElementById('yield-potential').textContent = 'Potencial: ' + pot + '%';

    document.getElementById('yield-result').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('yield-bar').style.width = pot + '%';
    }, 100);
}

function filterGuide() {
    const query = document.getElementById('guide-search').value.toLowerCase().trim();
    const cultivosItems = document.querySelectorAll('#cultivos-list .guide-item');
    const plagasItems = document.querySelectorAll('#plagas-list .plaga-item');

    let cultivosVisible = 0;
    let plagasVisible = 0;

    cultivosItems.forEach((item) => {
        const name = item.dataset.name || '';
        const title = item.querySelector('.title')?.textContent.toLowerCase() || '';
        const desc = item.querySelector('.desc')?.textContent.toLowerCase() || '';
        const match = !query || name.includes(query) || title.includes(query) || desc.includes(query);
        item.style.display = match ? 'flex' : 'none';
        if (match) cultivosVisible++;
    });

    plagasItems.forEach((item) => {
        const name = item.dataset.name || '';
        const plagaName = item.querySelector('.plaga-name')?.textContent.toLowerCase() || '';
        const crop = item.dataset.crop || '';
        const match = !query || name.includes(query) || plagaName.includes(query) || crop.includes(query);
        item.style.display = match ? 'flex' : 'none';
        if (match) plagasVisible++;
    });

    document.getElementById('cultivos-title').style.display = cultivosVisible > 0 ? 'block' : 'none';
    document.getElementById('plagas-title').style.display = plagasVisible > 0 ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
});

document.addEventListener('gesturestart', (e) => { e.preventDefault(); });

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLangModal();
        closeLangToast();
        closeGuideDetail();
    }
});
