const API_BASE_URL = '/api';

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
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
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

export const weightApi = {
  getWeightLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/weight${query ? `?${query}` : ''}`);
  },
  logWeight: (data) => request('/weight', { method: 'POST', body: JSON.stringify(data) }),
};

export const statsApi = {
  getDailyStats: (date) => request(`/stats/daily/${date}`),
  getTrends: (startDate, endDate) =>
    request(`/stats/trends?startDate=${startDate}&endDate=${endDate}`),
};
