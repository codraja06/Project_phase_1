import { axiosClient } from './axiosClient';
import { ENDPOINTS } from '../constants/endpoints';
import { Complaint, ComplaintStats } from '../types/complaint';

// axiosClient returns response.data = { success, data: ... }
export const complaintApi = {
  async createComplaint(data: any): Promise<Complaint> {
    const envelope: any = await axiosClient.post(ENDPOINTS.CITIZEN.COMPLAINTS, data);
    return envelope.data;
  },

  async getMyComplaints(params?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{ complaints: Complaint[]; stats: ComplaintStats }> {
    const envelope: any = await axiosClient.get(ENDPOINTS.CITIZEN.MY_COMPLAINTS, { params });
    return envelope.data;
  },

  async getComplaintById(id: string): Promise<Complaint> {
    const envelope: any = await axiosClient.get(ENDPOINTS.CITIZEN.COMPLAINT_DETAIL(id));
    return envelope.data;
  },
};
