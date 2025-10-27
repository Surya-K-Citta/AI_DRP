import { create } from 'zustand';

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
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
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
}));

