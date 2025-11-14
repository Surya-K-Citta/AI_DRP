// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Project {
  _id: string;
  projectName: string;
  projectType: 'individual' | 'cluster';
  industrySector: string;
  totalCost: number;
  ownContribution: number;
  loanAmount: number;
  location: string;
  status: 'draft' | 'in-progress' | 'completed';
  inputs: any;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  lastFetched: number | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setLastFetched: (timestamp: number) => void;
  isStale: () => boolean;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      lastFetched: null,
      setProjects: (projects) => set({ projects, lastFetched: Date.now() }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p._id === id ? { ...p, ...data } : p
          ),
          currentProject:
            state.currentProject?._id === id
              ? { ...state.currentProject, ...data }
              : state.currentProject,
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p._id !== id),
          currentProject:
            state.currentProject?._id === id ? null : state.currentProject,
        })),
      setLastFetched: (timestamp) => set({ lastFetched: timestamp }),
      isStale: () => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > CACHE_TTL;
      },
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

