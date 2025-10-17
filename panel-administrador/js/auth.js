// js/auth.js

// 1. Importamos el cliente de Supabase desde nuestro módulo
import { supabase } from './supabase.js';

// 2. Lógica del formulario de login (sin cambios)
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error al iniciar sesión:', error.message);
        errorMessage.textContent = 'Credenciales incorrectas. Inténtalo de nuevo.';
    } else {
        console.log('Inicio de sesión exitoso:', data);
        window.location.href = 'index.html';
    }
});