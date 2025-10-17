import { supabase } from './supabase.js';

// ---- CONFIGURACIÓN DE CLOUDINARY ----
const CLOUDINARY_CLOUD_NAME = 'dun3agkw7'; // 👈 Reemplaza con tu Cloud Name de Cloudinary
const CLOUDINARY_UPLOAD_PRESET = 'ml_default'; // 👈 Reemplaza si tu preset se llama diferente

// ---- ELEMENTOS DEL DOM ----
const logoutButton = document.getElementById('logout-button');
// Grupos
const addGroupForm = document.getElementById('add-group-form');
const groupNameInput = document.getElementById('group-name');
const listaGrupos = document.getElementById('grupos-lista');
// Alumnos
const addStudentForm = document.getElementById('add-student-form');
const studentNameInput = document.getElementById('student-name');
const studentGroupSelect = document.getElementById('student-group-select');
const listaAlumnos = document.getElementById('alumnos-lista');
const qrModal = document.getElementById('qr-modal');
const closeModalBtn = document.getElementById('close-modal');
const qrModalStudentName = document.getElementById('qr-modal-student-name');
const qrModalImage = document.getElementById('qr-modal-image');
const qrDownloadLink = document.getElementById('qr-download-link');
// Avisos
const addAvisoForm = document.getElementById('add-aviso-form');
const avisoTitleInput = document.getElementById('aviso-title');
const avisoMessageInput = document.getElementById('aviso-message');
const avisoGroupSelect = document.getElementById('aviso-group-select');
const listaAvisos = document.getElementById('avisos-lista');

// ---- FUNCIÓN AUXILIAR (NUEVA) ----
/**
 * Genera un código de invitación aleatorio de 6 caracteres. Ej: A4T2B9
 */
function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}


// ---- INICIALIZACIÓN Y AUTENTICACIÓN ----
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        await cargarDatosIniciales();
    }
});

logoutButton.addEventListener('click', () => supabase.auth.signOut().then(() => window.location.href = 'login.html'));
closeModalBtn.addEventListener('click', () => qrModal.style.display = 'none');

async function cargarDatosIniciales() {
    await cargarGrupos();
    await cargarAlumnos();
    await cargarAvisos();
}

// -------------------------------------------
// ---- LÓGICA CRUD PARA GRUPOS ------------
// -------------------------------------------
async function cargarGrupos() {
    const { data: grupos, error } = await supabase.from('grupos').select('id, nombre').order('created_at', { ascending: false });
    if (error) { console.error('Error al cargar los grupos:', error.message); return; }

    listaGrupos.innerHTML = '';
    if (grupos.length === 0) listaGrupos.innerHTML = `<p>Aún no hay grupos creados.</p>`;
    else grupos.forEach(grupo => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${grupo.nombre}</span><div class="group-actions"><button class="edit-btn" data-id="${grupo.id}" data-nombre="${grupo.nombre}">✏️ Editar</button><button class="delete-btn" data-id="${grupo.id}">🗑️ Borrar</button></div>`;
        listaGrupos.appendChild(li);
    });
    
    studentGroupSelect.innerHTML = '<option value="" disabled selected>Selecciona un grupo</option>';
    avisoGroupSelect.innerHTML = '<option value="all" selected>Para toda la escuela</option>';
    grupos.forEach(grupo => {
        const studentOption = document.createElement('option');
        studentOption.value = grupo.id;
        studentOption.textContent = grupo.nombre;
        studentGroupSelect.appendChild(studentOption);
        const avisoOption = document.createElement('option');
        avisoOption.value = grupo.id;
        avisoOption.textContent = `Solo para: ${grupo.nombre}`;
        avisoGroupSelect.appendChild(avisoOption);
    });
}
addGroupForm.addEventListener('submit', async (e) => { e.preventDefault(); const n = groupNameInput.value.trim(); if(n) await supabase.from('grupos').insert({ nombre: n }).then(({error}) => { if(error) console.error(error); else { groupNameInput.value = ''; cargarGrupos(); } }); });
listaGrupos.addEventListener('click', async (e) => { const t = e.target, id = t.dataset.id; if(t.classList.contains('delete-btn')) { if(confirm('¿Eliminar grupo?')) await supabase.from('grupos').delete().eq('id', id).then(() => cargarDatosIniciales()); } if(t.classList.contains('edit-btn')) { const nN = prompt('Nuevo nombre:', t.dataset.nombre); if(nN && nN.trim()) await supabase.from('grupos').update({ nombre: nN.trim() }).eq('id', id).then(() => cargarDatosIniciales()); } });

// -------------------------------------------
// ---- LÓGICA CRUD PARA ALUMNOS (ACTUALIZADA) -----------
// -------------------------------------------
async function cargarAlumnos() {
    // CAMBIO: Se añaden 'codigo_invitacion' y 'tutor_id' a la consulta
    const { data: alumnos, error } = await supabase
        .from('alumnos')
        .select('id, nombre_completo, qr_code_url, codigo_invitacion, tutor_id, grupos(nombre)')
        .order('created_at', { ascending: false });

    if (error) { console.error('Error al cargar alumnos:', error.message); return; }

    listaAlumnos.innerHTML = '';
    alumnos.forEach(alumno => {
        const tr = document.createElement('tr');
        const qrColumnHtml = alumno.qr_code_url ? `<img src="${alumno.qr_code_url}" alt="QR" style="width: 50px; cursor: pointer;" class="view-qr-btn" data-url="${alumno.qr_code_url}" data-nombre="${alumno.nombre_completo}">` : `<button class="generate-qr-btn" data-id="${alumno.id}">Generar QR</button>`;

        // CAMBIO: Lógica para mostrar el botón de invitación correcto
        let inviteButtonHtml = '';
        if (alumno.tutor_id) {
            inviteButtonHtml = '<span>✅ Vinculado</span>';
        } else if (alumno.codigo_invitacion) {
            inviteButtonHtml = `<button class="view-invite-btn" data-code="${alumno.codigo_invitacion}">Ver Código</button>`;
        } else {
            inviteButtonHtml = `<button class="generate-invite-btn" data-id="${alumno.id}">🔑 Invitar</button>`;
        }

        // CAMBIO: Se añade la nueva columna para la invitación
        tr.innerHTML = `
            <td>${alumno.nombre_completo}</td>
            <td>${alumno.grupos ? alumno.grupos.nombre : 'Sin grupo'}</td>
            <td>${qrColumnHtml}</td>
            <td>${inviteButtonHtml}</td>
            <td class="student-actions">
                <button class="edit-student-btn" data-id="${alumno.id}" data-nombre="${alumno.nombre_completo}">✏️ Editar</button>
                <button class="delete-student-btn" data-id="${alumno.id}">🗑️ Borrar</button>
            </td>`;
        listaAlumnos.appendChild(tr);
    });
}
async function generarYSubirQR(studentId) {
    const qrCanvas = document.createElement('div');
    new QRCode(qrCanvas, { text: studentId, width: 256, height: 256 });
    await new Promise(resolve => setTimeout(resolve, 100));
    const qrDataURL = qrCanvas.querySelector('canvas').toDataURL();
    const formData = new FormData();
    formData.append('file', qrDataURL);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
        const data = await response.json();
        if (!data.secure_url) throw new Error('No se pudo obtener la URL de Cloudinary.');
        await supabase.from('alumnos').update({ qr_code_url: data.secure_url }).eq('id', studentId);
        await cargarAlumnos();
    } catch (error) { console.error('Error en el proceso del QR:', error.message); alert('Hubo un error al generar el código QR.'); }
}
addStudentForm.addEventListener('submit', async (e) => { e.preventDefault(); const n = studentNameInput.value.trim(), g = studentGroupSelect.value; if(n && g) await supabase.from('alumnos').insert({ nombre_completo: n, grupo_id: g }).then(({error}) => { if(error) console.error(error); else { addStudentForm.reset(); cargarAlumnos(); } }); });

// CAMBIO: Se añaden los nuevos listeners para los botones de invitación
listaAlumnos.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    
    if (target.classList.contains('delete-student-btn')) { if (confirm('¿Eliminar alumno?')) await supabase.from('alumnos').delete().eq('id', id).then(() => cargarAlumnos()); }
    if (target.classList.contains('edit-student-btn')) { const nN = prompt('Nuevo nombre:', target.dataset.nombre); if (nN && nN.trim()) await supabase.from('alumnos').update({ nombre_completo: nN.trim() }).eq('id', id).then(() => cargarAlumnos()); }
    if (target.classList.contains('generate-qr-btn')) { target.textContent = 'Generando...'; target.disabled = true; await generarYSubirQR(id); }
    if (target.classList.contains('view-qr-btn')) { qrModalStudentName.textContent = target.dataset.nombre; qrModalImage.innerHTML = `<img src="${target.dataset.url}" alt="QR">`; qrDownloadLink.href = target.dataset.url; qrModal.style.display = 'flex'; }
    
    // NUEVO: Lógica para generar y ver códigos de invitación
    if (target.classList.contains('generate-invite-btn')) {
        const codigo = generarCodigo();
        target.textContent = 'Generando...';
        target.disabled = true;

        const { error } = await supabase.from('alumnos').update({ codigo_invitacion: codigo }).eq('id', id);
        if (error) {
            alert('No se pudo generar el código.');
        } else {
            alert(`Código de invitación generado:\n\n${codigo}\n\nCompártelo con el tutor.`);
        }
        await cargarAlumnos();
    }

    if (target.classList.contains('view-invite-btn')) {
        const codigo = target.dataset.code;
        alert(`El código de invitación actual es:\n\n${codigo}`);
    }
});

// -------------------------------------------
// ---- LÓGICA CRUD PARA AVISOS ----
// -------------------------------------------
async function cargarAvisos() {
    const { data: avisos, error } = await supabase.from('avisos').select('id, titulo, mensaje, created_at, grupos(nombre)').order('created_at', { ascending: false });
    if (error) { console.error("Error al cargar avisos:", error.message); return; }

    listaAvisos.innerHTML = '';
    avisos.forEach(aviso => {
        const li = document.createElement('li');
        const fecha = new Date(aviso.created_at).toLocaleString('es-ES');
        const destinatario = aviso.grupos ? aviso.grupos.nombre : 'Toda la escuela';
        li.innerHTML = `<div class="aviso-content"><h4>${aviso.titulo}</h4><p>${aviso.mensaje}</p></div><div class="aviso-meta"><p>Para: <strong>${destinatario}</strong></p><p>${fecha}</p><button class="delete-aviso-btn" data-id="${aviso.id}">🗑️ Borrar</button></div>`;
        listaAvisos.appendChild(li);
    });
}
// Reemplaza esta función en tu archivo admin-panel/js/main.js

addAvisoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ESCUELA_ID = 'a077f0b4-453a-4810-8bc5-c3a8b087b453'; // 👈 Asegúrate de que este sea tu ID de escuela

    const titulo = avisoTitleInput.value.trim();
    const mensaje = avisoMessageInput.value.trim();
    const destinatarioId = avisoGroupSelect.value;

    if (!titulo || !mensaje) {
        alert("El título y el mensaje no pueden estar vacíos.");
        return;
    }
    
    const nuevoAviso = {
        titulo,
        mensaje,
        grupo_id: destinatarioId === 'all' ? null : destinatarioId,
        escuela_id: destinatarioId === 'all' ? ESCUELA_ID : null
    };

    // 1. Guarda el aviso en la base de datos
    const { data: avisoGuardado, error } = await supabase.from('avisos').insert(nuevoAviso).select().single();

    if (error) {
        console.error("Error al guardar aviso:", error.message);
        alert("No se pudo guardar el aviso.");
        return;
    }

    // 2. Si se guardó, llama a la Edge Function para enviar las notificaciones
    alert("Aviso guardado, enviando notificaciones...");
    
    // El cuerpo de la función espera 'grupo_id' o 'escuela_id'
    const notificationBody = {
      titulo,
      mensaje,
      grupo_id: avisoGuardado.grupo_id,
      escuela_id: avisoGuardado.escuela_id,
    }

    const { error: functionError } = await supabase.functions.invoke('send-bulk-notification', {
      body: notificationBody,
    });

    if (functionError) {
      alert("El aviso se guardó, pero hubo un error al enviar las notificaciones.");
      console.error("Error al invocar la función:", functionError);
    } else {
      alert("¡Aviso y notificaciones enviados con éxito!");
    }
    
    addAvisoForm.reset();
    await cargarAvisos();
});
listaAvisos.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-aviso-btn')) {
        const id = e.target.dataset.id;
        if (confirm("¿Seguro que quieres eliminar este aviso?")) {
            const { error } = await supabase.from('avisos').delete().eq('id', id);
            if (error) { console.error("Error al borrar aviso:", error); }
            else { await cargarAvisos(); }
        }
    }
});