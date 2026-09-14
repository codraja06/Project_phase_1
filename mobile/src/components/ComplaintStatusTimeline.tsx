import React from 'react';
import { Timeline } from './Timeline';
import { ComplaintStatus } from '../types/complaint';

interface ComplaintStatusTimelineProps {
  status: ComplaintStatus;
  verified?: boolean;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
}

export const ComplaintStatusTimeline: React.FC<ComplaintStatusTimelineProps> = (props) => {
  return <Timeline {...props} />;
};
