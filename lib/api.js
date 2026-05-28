const API_BASE_URL = '/api';

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
    const data = await response.json();
    if (!response.ok) {
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
