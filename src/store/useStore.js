import { create } from 'zustand';
import { mockDrawings, mockInspectionPlans } from '../data/mockData.js';

export const useStore = create((set) => ({
  drawings: mockDrawings,
  plans: mockInspectionPlans,
  selectedDrawing: null,
  setSelectedDrawing: (drawing) => set({ selectedDrawing: drawing }),
}));