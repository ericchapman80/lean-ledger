const API_BASE_URL = '/api';
export const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please sign in again.';

function getBrowserDateHeaders() {
  if (typeof window === 'undefined') return {};

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    'x-time-zone': timeZone,
    'x-local-date': `${values.year}-${values.month}-${values.day}`,
  };
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function buildLoginRedirectUrl(pathname = '/', reason = 'session-expired') {
  const sanitizedPath = pathname && pathname.startsWith('/') ? pathname : '/';
  const params = new URLSearchParams({ reason });

  if (sanitizedPath !== '/login') {
    params.set('next', sanitizedPath);
  }

  return `/login?${params.toString()}`;
}

async function parseResponseData(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { error: text } : {};
}

function handleUnauthorizedResponse(data) {
  if (typeof window === 'undefined') {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, data);
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname !== '/login') {
    window.location.assign(buildLoginRedirectUrl(currentPath));
  }

  throw new ApiError(SESSION_EXPIRED_MESSAGE, 401, data);
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getBrowserDateHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await parseResponseData(response);
    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorizedResponse(data);
      }
      throw new ApiError(data.error || 'An error occurred', response.status, data);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error', 0, { originalError: error.message });
  }
}

export const profileApi = {
  getProfile: () => request('/profile'),
  createOrUpdateProfile: (data) =>
    request('/profile', { method: 'POST', body: JSON.stringify(data) }),
};

export const mealsApi = {
  getMeals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/meals${query ? `?${query}` : ''}`);
  },
  createMeal: (data) => request('/meals', { method: 'POST', body: JSON.stringify(data) }),
  updateMeal: (id, data) => request(`/meals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMeal: (id) => request(`/meals/${id}`, { method: 'DELETE' }),
};

export const favoriteMealsApi = {
  getFavoriteMeals: () => request('/favorite-meals'),
  createFavoriteMeal: (data) =>
    request('/favorite-meals', { method: 'POST', body: JSON.stringify(data) }),
  deleteFavoriteMeal: (id) => request(`/favorite-meals/${id}`, { method: 'DELETE' }),
};

export const favoriteFoodsApi = {
  getFavoriteFoods: () => request('/favorite-foods'),
  createFavoriteFood: (data) =>
    request('/favorite-foods', { method: 'POST', body: JSON.stringify(data) }),
  deleteFavoriteFood: (id) => request(`/favorite-foods/${id}`, { method: 'DELETE' }),
};

export const favoriteBeveragesApi = {
  getFavoriteBeverages: () => request('/favorite-beverages'),
  createFavoriteBeverage: (data) =>
    request('/favorite-beverages', { method: 'POST', body: JSON.stringify(data) }),
  deleteFavoriteBeverage: (id) => request(`/favorite-beverages/${id}`, { method: 'DELETE' }),
};

export const weightApi = {
  getWeightLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/weight${query ? `?${query}` : ''}`);
  },
  logWeight: (data) => request('/weight', { method: 'POST', body: JSON.stringify(data) }),
};

export const healthMetricsApi = {
  getHealthMetrics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/health-metrics${query ? `?${query}` : ''}`);
  },
  createHealthMetric: (data) =>
    request('/health-metrics', { method: 'POST', body: JSON.stringify(data) }),
  importHealthMetrics: (rows) =>
    request('/health-metrics/import', { method: 'POST', body: JSON.stringify({ rows }) }),
};

export const habitDefinitionsApi = {
  getHabitDefinitions: () => request('/habit-definitions'),
  createHabitDefinition: (data) =>
    request('/habit-definitions', { method: 'POST', body: JSON.stringify(data) }),
  updateHabitDefinition: (id, data) =>
    request(`/habit-definitions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHabitDefinition: (id) => request(`/habit-definitions/${id}`, { method: 'DELETE' }),
};

export const dailyHabitsApi = {
  getDailyHabitLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/daily-habits${query ? `?${query}` : ''}`);
  },
  upsertDailyHabitLog: (data) =>
    request('/daily-habits', { method: 'POST', body: JSON.stringify(data) }),
};

export const waterApi = {
  getWaterEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/water${query ? `?${query}` : ''}`);
  },
  createWaterEntry: (data) => request('/water', { method: 'POST', body: JSON.stringify(data) }),
};

export const beverageApi = {
  getBeverages: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/beverages${query ? `?${query}` : ''}`);
  },
  createBeverage: (data) => request('/beverages', { method: 'POST', body: JSON.stringify(data) }),
  updateBeverage: (id, data) =>
    request(`/beverages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBeverage: (id) => request(`/beverages/${id}`, { method: 'DELETE' }),
};

export const statsApi = {
  getDailyStats: (date) => request(`/stats/daily/${date}`),
  getWeeklyStats: (date) => request(`/stats/weekly${date ? `?date=${date}` : ''}`),
  getTrends: (startDate, endDate) =>
    request(`/stats/trends?startDate=${startDate}&endDate=${endDate}`),
};

export const authApi = {
  getStatus: () => request('/auth/status'),
};

export const accessApi = {
  getMembers: () => request('/access/members'),
  inviteMember: (data) => request('/access/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id, data) => request(`/access/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  revokeMember: (id) => request(`/access/members/${id}`, { method: 'DELETE' }),
};
