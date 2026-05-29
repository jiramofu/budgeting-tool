import axios, { AxiosInstance } from 'axios';

// Determine API URL dynamically
// If VITE_API_URL is explicitly set, use that
// Otherwise, use the same host as the current page but port 3001
const getApiUrl = (): string => {
  // Check if explicitly configured
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // For development: detect if accessed via network IP or localhost
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  // If accessed from localhost, use localhost:3001 (backend port)
  // If accessed from a network IP or domain, use that IP/domain:3001
  return `${protocol}//${hostname}:3001/api`;
};

const API_URL = getApiUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  signup(email: string, password: string, firstName?: string, lastName?: string, country?: string) {
    return this.client.post('/auth/signup', { email, password, firstName, lastName, country });
  }

  login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  // Budget endpoints
  getCurrentBudget() {
    return this.client.get('/budgets/current');
  }

  createBudget(month: number, year: number) {
    return this.client.post('/budgets', { month, year });
  }

  // Category endpoints
  getCategories() {
    return this.client.get('/categories');
  }

  createCategory(name: string, type: 'fixed' | 'variable' | 'recurring', color?: string) {
    return this.client.post('/categories', { name, type, color });
  }

  // Transaction endpoints
  getTransactions(budgetId?: number, categoryId?: number, startDate?: string, endDate?: string) {
    return this.client.get('/transactions', {
      params: { budgetId, categoryId, startDate, endDate },
    });
  }

  createTransaction(
    categoryId: number,
    amount: number,
    transactionDate: string,
    budgetId?: number,
    description?: string
  ) {
    return this.client.post('/transactions', {
      budgetId,
      categoryId,
      amount,
      description,
      transactionDate,
    });
  }

  deleteTransaction(transactionId: number) {
    return this.client.delete(`/transactions/${transactionId}`);
  }

  // Bills endpoints
  getBills() {
    return this.client.get('/bills');
  }

  getBillSummary() {
    return this.client.get('/bills/summary');
  }

  getUpcomingBills(days?: number) {
    return this.client.get('/bills/upcoming', { params: { days } });
  }

  createBill(
    name: string,
    amount: number,
    dueDateDay: number,
    frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time',
    categoryId?: number,
    notes?: string
  ) {
    return this.client.post('/bills', { name, amount, dueDateDay, frequency, categoryId, notes });
  }

  updateBill(billId: number, updates: any) {
    return this.client.put(`/bills/${billId}`, updates);
  }

  markBillAsPaid(billId: number) {
    return this.client.post(`/bills/${billId}/mark-paid`);
  }

  createTransactionFromBill(billId: number) {
    return this.client.post(`/bills/${billId}/create-transaction`);
  }

  deleteBill(billId: number) {
    return this.client.delete(`/bills/${billId}`);
  }

  // Goals endpoints
  getGoals(activeOnly?: boolean) {
    return this.client.get('/goals', { params: { active: activeOnly } });
  }

  getGoalSummary() {
    return this.client.get('/goals/summary');
  }

  getGoalAlerts() {
    return this.client.get('/goals/alerts');
  }

  createGoal(
    name: string,
    goalType: 'savings' | 'debt-payoff' | 'expense-reduction' | 'investment',
    targetAmount: number,
    targetDate?: string,
    categoryId?: number,
    description?: string
  ) {
    return this.client.post('/goals', { name, goalType, targetAmount, targetDate, categoryId, description });
  }

  updateGoal(goalId: number, updates: any) {
    return this.client.put(`/goals/${goalId}`, updates);
  }

  addGoalProgress(goalId: number, amount: number, notes?: string) {
    return this.client.post(`/goals/${goalId}/progress`, { amount, notes });
  }

  getGoalProgress(goalId: number, limit?: number) {
    return this.client.get(`/goals/${goalId}/progress`, { params: { limit } });
  }

  deleteGoal(goalId: number) {
    return this.client.delete(`/goals/${goalId}`);
  }

  // Household endpoints
  getHouseholds() {
    return this.client.get('/households');
  }

  getPendingInvitations() {
    return this.client.get('/households/invitations/pending');
  }

  getHousehold(householdId: number) {
    return this.client.get(`/households/${householdId}`);
  }

  getHouseholdMembers(householdId: number) {
    return this.client.get(`/households/${householdId}/members`);
  }

  getHouseholdInvitations(householdId: number) {
    return this.client.get(`/households/${householdId}/invitations`);
  }

  createHousehold(name: string, description?: string) {
    return this.client.post('/households', { name, description });
  }

  inviteMember(householdId: number, invitedEmail: string, role: 'admin' | 'editor' | 'viewer') {
    return this.client.post(`/households/${householdId}/invite`, { invitedEmail, role });
  }

  acceptInvitation(token: string) {
    return this.client.post(`/households/accept/${token}`, {});
  }

  updateMemberRole(householdId: number, memberId: number, role: 'admin' | 'editor' | 'viewer') {
    return this.client.put(`/households/${householdId}/members/${memberId}/role`, { role });
  }

  removeMember(householdId: number, memberId: number) {
    return this.client.delete(`/households/${householdId}/members/${memberId}`);
  }

  deleteHousehold(householdId: number) {
    return this.client.delete(`/households/${householdId}`);
  }

  // Smart Rules endpoints
  getRecommendations(month?: number, year?: number) {
    return this.client.get('/smart-rules/recommendations', {
      params: { month, year },
    });
  }

  getAnomalies(categoryId: number) {
    return this.client.get(`/smart-rules/anomalies/${categoryId}`);
  }

  getAllAnomalies() {
    return this.client.get('/smart-rules/all-anomalies');
  }

  getSpendingForecast(categoryId: number, daysAhead?: number) {
    return this.client.get(`/smart-rules/forecast/${categoryId}`, {
      params: { daysAhead },
    });
  }

  // Settings endpoints
  getUserSettings() {
    return this.client.get('/user/settings');
  }

  updateUserSettings(updates: any) {
    return this.client.post('/user/settings', updates);
  }

  uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post('/user/settings/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Import endpoints
  importCSV(file: File, budgetId?: number, categoryId?: number, dateColumn?: string, descriptionColumn?: string, amountColumn?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (budgetId) formData.append('budgetId', budgetId.toString());
    if (categoryId) formData.append('categoryId', categoryId.toString());
    if (dateColumn) formData.append('dateColumn', dateColumn);
    if (descriptionColumn) formData.append('descriptionColumn', descriptionColumn);
    if (amountColumn) formData.append('amountColumn', amountColumn);

    return this.client.post('/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Generic methods
  get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

export const apiClient = new ApiClient();
