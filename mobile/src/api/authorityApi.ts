import { axiosClient } from './axiosClient';
import { ENDPOINTS } from '../constants/endpoints';
import { Complaint, ComplaintStats } from '../types/complaint';

// axiosClient returns response.data = { success, data: ... }
export const authorityApi = {
  async getAllComplaints(params?: {
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
  }): Promise<{ complaints: Complaint[]; stats: ComplaintStats }> {
    const envelope: any = await axiosClient.get(ENDPOINTS.AUTHORITY.COMPLAINTS, { params });
    return envelope.data;
  },

  async getComplaintById(id: string): Promise<Complaint> {
    const envelope: any = await axiosClient.get(ENDPOINTS.AUTHORITY.COMPLAINT_DETAIL(id));
    return envelope.data;
  },

  async updateStatus(id: string, status: string): Promise<Complaint> {
    const envelope: any = await axiosClient.patch(ENDPOINTS.AUTHORITY.UPDATE_STATUS(id), { status });
    return envelope.data;
  },

  async updateComplaintStatus(id: string, status: string): Promise<Complaint> {
    return this.updateStatus(id, status);
  },

  async verifyComplaint(id: string): Promise<Complaint> {
    const envelope: any = await axiosClient.patch(ENDPOINTS.AUTHORITY.VERIFY(id));
    return envelope.data;
  },

  async deleteComplaint(id: string): Promise<void> {
    await axiosClient.delete(ENDPOINTS.AUTHORITY.DELETE_COMPLAINT(id));
  },
};
