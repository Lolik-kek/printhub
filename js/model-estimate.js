(function () {
  const drop = document.getElementById('model-drop');
  const fileInput = document.getElementById('model-file');
  const info = document.getElementById('model-info');
  if (!drop || !fileInput) return;

  function measureGeometry(geom, matrix) {
    const pos = geom.attributes.position;
    if (!pos) return { volume: 0, area: 0, tris: 0 };
    const idx = geom.index;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const ab = new THREE.Vector3(), ac = new THREE.Vector3(), cr = new THREE.Vector3();
    const read = (i, t) => { t.fromBufferAttribute(pos, i); if (matrix) t.applyMatrix4(matrix); };
    const triCount = idx ? idx.count / 3 : pos.count / 3;
    let volume = 0, area = 0;
    for (let t = 0; t < triCount; t++) {
      let i0, i1, i2;
      if (idx) { i0 = idx.getX(t * 3); i1 = idx.getX(t * 3 + 1); i2 = idx.getX(t * 3 + 2); }
      else { i0 = t * 3; i1 = t * 3 + 1; i2 = t * 3 + 2; }
      read(i0, a); read(i1, b); read(i2, c);
      volume += a.dot(cr.crossVectors(b, c)) / 6.0;
      ab.subVectors(b, a); ac.subVectors(c, a);
      area += cr.crossVectors(ab, ac).length() / 2;
    }
    return { volume: Math.abs(volume), area: area, tris: triCount };
  }

  function measureObject(object) {
    let volume = 0, area = 0, tris = 0;
    object.updateMatrixWorld(true);
    object.traverse(o => {
      if (o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
        const r = measureGeometry(o.geometry, o.matrixWorld);
        volume += r.volume; area += r.area; tris += r.tris;
      }
    });
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3(); box.getSize(size);
    return { volume, area, tris, size };
  }

  function parseModel(ext, buffer) {
    if (ext === 'stl') {
      const geom = new THREE.STLLoader().parse(buffer);
      return new THREE.Mesh(geom);
    }
    if (ext === 'obj') {
      const text = new TextDecoder().decode(buffer);
      return new THREE.OBJLoader().parse(text);
    }
    if (ext === '3mf') {
      const Loader = THREE.ThreeMFLoader || THREE['3MFLoader'];
      return new Loader().parse(buffer);
    }
    throw new Error('Неподдерживаемый формат');
  }

  function complexityOf(tris) {
    if (tris < 50000) return { label: 'Низкая', mult: 1.0 };
    if (tris < 200000) return { label: 'Средняя', mult: 1.15 };
    return { label: 'Высокая', mult: 1.3 };
  }

  function fmt(n) { return Math.round(n).toLocaleString('ru'); }

  function handleFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['stl', 'obj', '3mf'].includes(ext)) {
      info.innerHTML = '<span style="color:#dc2626">Поддерживаются только STL, OBJ и 3MF.</span>';
      return;
    }
    info.innerHTML = '<span style="color:#888">Анализируем модель…</span>';
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = parseModel(ext, reader.result);
        const m = measureObject(obj);
        if (!m.volume || m.volume <= 0) {
          info.innerHTML = '<span style="color:#dc2626">Не удалось определить объём (модель не замкнута?). Попробуйте другой файл.</span>';
          return;
        }
        const cm = complexityOf(m.tris);
        window.phModel = {
          filename: file.name,
          volumeMm3: m.volume,
          areaMm2: m.area,
          triCount: m.tris,
          complexityMult: cm.mult,
          complexityLabel: cm.label
        };
        if (typeof calcPrice === 'function') calcPrice();

        const volCm3 = (m.volume / 1000).toFixed(1);
        info.innerHTML = `
          <div class="model-stats">
            <div><span>Файл</span><b>${file.name.replace(/[<>]/g, '')}</b></div>
            <div><span>Объём модели</span><b>${volCm3} см³ (${fmt(m.volume)} мм³)</b></div>
            <div><span>Габариты</span><b>${fmt(m.size.x)}×${fmt(m.size.y)}×${fmt(m.size.z)} мм</b></div>
            <div><span>Треугольников</span><b>${fmt(m.tris)}</b></div>
            <div><span>Сложность</span><b>${cm.label}</b></div>
          </div>
          <p class="model-hint">Цена рассчитана по реальному объёму модели.</p>`;
        drop.classList.add('has-model');
      } catch (e) {
        console.error(e);
        info.innerHTML = '<span style="color:#dc2626">Не удалось прочитать файл. Проверьте, что это корректный STL, OBJ или 3MF.</span>';
      }
    };
    reader.onerror = () => { info.innerHTML = '<span style="color:#dc2626">Ошибка чтения файла.</span>'; };
    reader.readAsArrayBuffer(file);
  }

  drop.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('dragover'); }));
  drop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
})();
