import apiInstance from './axiosInstance';

/**
 * Service for fetching dashboard data for different user roles
 */
class DashboardService {
  /**
   * Get lecturer dashboard statistics
   */
  async getLecturerStats() {
    try {
      const response = await apiInstance.get('/api/lecturer/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching lecturer stats:', error);
      // Return fallback data if API fails
      return {
        myBookings: 0,
        myResources: 0,
        upcomingClasses: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Get lecturer recent activity
   */
  async getLecturerActivity() {
    try {
      const response = await apiInstance.get('/api/lecturer/dashboard/activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching lecturer activity:', error);
      return [];
    }
  }

  /**
   * Get student dashboard statistics
   */
  async getStudentStats() {
    try {
      const response = await apiInstance.get('/api/student/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      // Return fallback data if API fails
      return {
        myBookings: 0,
        myResources: 0,
        activeTickets: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Get student recent activity
   */
  async getStudentActivity() {
    try {
      const response = await apiInstance.get('/api/student/dashboard/activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching student activity:', error);
      return [];
    }
  }

  /**
   * Get staff dashboard statistics
   */
  async getStaffStats() {
    try {
      const response = await apiInstance.get('/api/staff/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      // Return fallback data if API fails
      return {
        myResources: 0,
        resourceRequests: 0,
        pendingApprovals: 0,
        recentActivity: []
      };
    }
  }

  /**
   * Get staff recent activity
   */
  async getStaffActivity() {
    try {
      const response = await apiInstance.get('/api/staff/dashboard/activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff activity:', error);
      return [];
    }
  }

  /**
   * Get user's bookings (for lecturer/student)
   */
  async getUserBookings() {
    try {
      const response = await apiInstance.get('/api/user/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
  }

  /**
   * Get user's resources (for lecturer/student/staff)
   */
  async getUserResources() {
    try {
      const response = await apiInstance.get('/api/user/resources');
      return response.data;
    } catch (error) {
      console.error('Error fetching user resources:', error);
      return [];
    }
  }

  /**
   * Get user's tickets (for student)
   */
  async getUserTickets() {
    try {
      const response = await apiInstance.get('/api/user/tickets');
      return response.data;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }

  /**
   * Get upcoming classes (for lecturer)
   */
  async getUpcomingClasses() {
    try {
      const response = await apiInstance.get('/api/lecturer/upcoming-classes');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
      return [];
    }
  }

  /**
   * Get resource requests (for staff)
   */
  async getResourceRequests() {
    try {
      const response = await apiInstance.get('/api/staff/resource-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching resource requests:', error);
      return [];
    }
  }

  /**
   * Get pending approvals (for staff)
   */
  async getPendingApprovals() {
    try {
      const response = await apiInstance.get('/api/staff/pending-approvals');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
