import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CAF-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const supabaseUrl = `https://${projectId}.supabase.co`;

// Single instance of Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sb-auth-token',
      }
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

// API helpers
const API_BASE = `${supabaseUrl}/functions/v1/make-server-8a892de6`;

export const api = {
  signup: async (email: string, password: string, name: string, phone?: string) => {
    try {
      console.log('=== REGISTRO ===');
      console.log('Email:', email, '| Nombre:', name);

      const code = generateUserCode();
      const supabase = getSupabase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone: phone || '', code },
        },
      });

      if (error) {
        console.error('Error de Supabase:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ Usuario registrado:', data);

      // Store session if available
      if (data.session) {
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
      }

      return {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.user_metadata?.name,
          phone: data.user?.user_metadata?.phone,
          code: data.user?.user_metadata?.code,
        }
      };
    } catch (error) {
      console.error('❌ Error en signup:', error);
      throw error;
    }
  },

  signin: async (email: string, password: string) => {
    try {
      console.log('=== INICIO DE SESIÓN ===');
      console.log('Email:', email);

      const supabase = getSupabase();

      // Sign in with Supabase directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error de Supabase:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ Sesión iniciada:', data);

      // Store session
      if (data.session) {
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
      }

      return {
        success: true,
        session: data.session,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name
        }
      };
    } catch (error) {
      console.error('❌ Error en signin:', error);
      throw error;
    }
  },

  getProfile: async () => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('No hay sesión activa');
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name,
        phone: user.user_metadata?.phone || '',
        code: user.user_metadata?.code || '',
      }
    };
  },

  signout: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_session');
  },

  getSession: async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  isAuthenticated: () => {
    const supabase = getSupabase();
    const session = localStorage.getItem('supabase_session');
    return !!session;
  },

  createReservation: async (reservationData: any) => {
    try {
      console.log('=== CREANDO RESERVA ===');
      console.log('Datos:', reservationData);

      const session = localStorage.getItem('supabase_session');
      let userId = null;
      let accessToken = null;

      if (session) {
        const sessionData = JSON.parse(session);
        userId = sessionData.user?.id;
        accessToken = sessionData.access_token;
      }

      const reservation = {
        ...reservationData,
        user_id: userId,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        id: `RES-${Date.now()}`
      };

      console.log('Enviando a:', `${API_BASE}/reservations`);
      console.log('Reserva completa:', reservation);

      // Save to key-value store
      const response = await fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || publicAnonKey}`
        },
        body: JSON.stringify(reservation),
      });

      console.log('Status de respuesta:', response.status);

      let data;
      try {
        const text = await response.text();
        console.log('Respuesta del servidor:', text);

        if (!text || text.trim() === '') {
          throw new Error('El servidor no devolvió ninguna respuesta');
        }

        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error al parsear respuesta:', parseError);
        throw new Error('Respuesta inválida del servidor');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear reserva');
      }

      console.log('✅ Reserva creada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error al crear reserva:', error);
      throw error;
    }
  },

  getUserReservations: async () => {
    try {
      console.log('=== OBTENIENDO RESERVAS ===');
      const session = localStorage.getItem('supabase_session');

      if (!session) {
        console.log('No hay sesión activa, devolviendo array vacío');
        return { reservations: [] };
      }

      const { access_token } = JSON.parse(session);

      console.log('Haciendo petición a:', `${API_BASE}/reservations`);

      const response = await fetch(`${API_BASE}/reservations`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      console.log('Status:', response.status);

      if (!response.ok) {
        console.warn('Respuesta no OK, devolviendo array vacío');
        return { reservations: [] };
      }

      let data;
      try {
        const text = await response.text();
        console.log('Respuesta del servidor (texto):', text);

        if (!text || text.trim() === '') {
          console.log('Respuesta vacía, devolviendo array vacío');
          return { reservations: [] };
        }

        data = JSON.parse(text);
        console.log('Datos parseados:', data);
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError);
        return { reservations: [] };
      }

      return data;
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      return { reservations: [] };
    }
  },

  cancelReservation: async (reservationId: string, reason: string) => {
    const session = localStorage.getItem('supabase_session');
    if (!session) throw new Error('No hay sesión activa');
    const { access_token } = JSON.parse(session);

    const response = await fetch(`${API_BASE}/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al cancelar la reserva');
    return data;
  },

  getAdminNotifications: async () => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error');
    return data.notifications || [];
  },

  markAllNotificationsRead: async () => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    await fetch(`${API_BASE}/admin/notifications/read-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },

  getReservationHistory: async () => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/reservation-history`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al obtener historial');
    return data.history || [];
  },

  // ─── Admin ───────────────────────────────────────────────────────────────

  searchUsers: async (q: string) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const url = new URL(`${API_BASE}/admin/users`);
    if (q) url.searchParams.set('q', q);
    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al buscar usuarios');
    return data.users || [];
  },

  setupAdmin: async (password: string) => {
    const response = await fetch(`${API_BASE}/admin/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al crear administrador');
    return data;
  },

  adminSignin: async (password: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@elcafetin.com',
      password,
    });
    if (error) throw new Error('Credenciales incorrectas');
    return data;
  },

  getAdminToken: () => {
    const session = localStorage.getItem('supabase_session');
    if (!session) return null;
    try {
      return JSON.parse(session).access_token || null;
    } catch {
      return null;
    }
  },

  getAllReservations: async () => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/reservations`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al obtener reservas');
    return data.reservations || [];
  },

  updateReservationStatus: async (id: string, status: string) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    try {
      const response = await fetch(`${API_BASE}/admin/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al actualizar reserva');
      return data;
    } catch (error: any) {
      if (error?.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con Supabase. Revisa que la función esté desplegada y que CORS permita PUT.');
      }
      throw error;
    }
  },

  adminDeleteReservation: async (id: string) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/reservations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al eliminar reserva');
    return data;
  },

  processOcrReservations: async (fecha: string, texto: string) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/api/reservas/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ fecha, texto }),
    });
    const raw = await response.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      const preview = raw?.replace(/\s+/g, ' ').trim().slice(0, 160);
      throw new Error(preview
        ? `El servidor no devolvió JSON válido: ${preview}`
        : 'El servidor no devolvió una respuesta válida');
    }
    if (!response.ok) throw new Error(data.error || 'Error al procesar reservas OCR');
    return data;
  },

  // ─── Menus ────────────────────────────────────────────────────────────────

  getWeekdayMenu: async () => {
    const response = await fetch(`${API_BASE}/menus/weekday`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });
    if (!response.ok) throw new Error('Error al obtener menú');
    return response.json();
  },

  getWeekendMenu: async () => {
    const response = await fetch(`${API_BASE}/menus/weekend`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });
    if (!response.ok) throw new Error('Error al obtener menú');
    return response.json();
  },

  getGastrotecaMenu: async () => {
    const response = await fetch(`${API_BASE}/menus/gastroteca`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });
    if (!response.ok) throw new Error('Error al obtener menú de Gastroteca');
    return response.json();
  },

  saveWeekdayMenu: async (data: any) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/menus/weekday`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || 'Error al guardar');
    return res;
  },

  saveWeekendMenu: async (data: any) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/menus/weekend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || 'Error al guardar');
    return res;
  },

  saveGastrotecaMenu: async (data: any) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/menus/gastroteca`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || 'Error al guardar menú de Gastroteca');
    return res;
  },

  getBeverages: async () => {
    const response = await fetch(`${API_BASE}/beverages`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });
    if (!response.ok) throw new Error('Error al obtener bebidas');
    return response.json();
  },

  saveBeverages: async (data: any) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/beverages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || 'Error al guardar bebidas');
    return res;
  },

  getWineList: async () => {
    const response = await fetch(`${API_BASE}/wine-list`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });
    if (!response.ok) throw new Error('Error al obtener carta de vinos');
    return response.json();
  },

  saveWineList: async (data: any) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/wine-list`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || 'Error al guardar carta de vinos');
    return res;
  },

  getGeneralMenu: async () => {
    const response = await fetch(`${API_BASE}/general-menu`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });
    if (!response.ok) throw new Error('Error al obtener carta general');
    return response.json();
  },

  saveGeneralMenu: async (data: any) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/general-menu`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || 'Error al guardar carta general');
    return res;
  },

  getBreakfastMenu: async () => {
    const response = await fetch(`${API_BASE}/breakfast-menu`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    });
    if (!response.ok) throw new Error('Error al obtener carta de desayunos');
    return response.json();
  },

  saveBreakfastMenu: async (data: any) => {
    const token = api.getAdminToken();
    if (!token) throw new Error('No hay sesión de administrador');
    const response = await fetch(`${API_BASE}/admin/breakfast-menu`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const res = await response.json();
    if (!response.ok) throw new Error(res.error || 'Error al guardar carta de desayunos');
    return res;
  },

  getZoneAvailability: async (date: string, time: string, guests?: string | number): Promise<Record<string, { total: number; reserved: number; available: number; canFit?: boolean }>> => {
    try {
      const response = await fetch(`${API_BASE}/zone-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, guests }),
      });
      if (!response.ok) return {};
      const data = await response.json();
      return data.availability || {};
    } catch (error) {
      console.error('Error al obtener disponibilidad por zona:', error);
      return {};
    }
  }
};
