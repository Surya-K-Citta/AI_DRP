import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FolderPlus, FileText, TrendingUp, MessageSquare, Building, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, setProjects } = useProjectStore();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.getProjects({ limit: 5 });
      setProjects(response.data.projects);
      
      const total = response.data.pagination.total;
      const completed = response.data.projects.filter((p: any) => p.status === 'completed').length;
      const inProgress = response.data.projects.filter((p: any) => p.status === 'in-progress').length;
      
      setStats({ total, completed, inProgress });
    } catch (error) {
      console.error('Failed to load projects');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">
            {t('common.welcome')}, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.title')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('dashboard.totalProjects')}
                  </p>
                  <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                </div>
                <Building className="h-12 w-12 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('dashboard.completedDPRs')}
                  </p>
                  <h3 className="text-3xl font-bold mt-2">{stats.completed}</h3>
                </div>
                <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('dashboard.inProgress')}
                  </p>
                  <h3 className="text-3xl font-bold mt-2">{stats.inProgress}</h3>
                </div>
                <Clock className="h-12 w-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate('/projects/create')}
                className="h-24 flex-col"
              >
                <FolderPlus className="h-8 w-8 mb-2" />
                {t('dashboard.createNewProject')}
              </Button>
              {/* <Button
                onClick={() => navigate('/schemes')}
                variant="outline"
                className="h-24 flex-col"
              >
                <FileText className="h-8 w-8 mb-2" />
                {t('dashboard.viewSchemes')}
              </Button> */}
              <Button
                onClick={() => navigate('/chat')}
                variant="outline"
                className="h-24 flex-col"
              >
                <MessageSquare className="h-8 w-8 mb-2" />
                {t('dashboard.chatWithAI')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('dashboard.recentProjects')}</CardTitle>
              <Button variant="ghost" onClick={() => navigate('/projects')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No projects yet. Create your first project to get started!
              </p>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project: any) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    <div>
                      <h4 className="font-semibold">{project.projectName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.industrySector} • {project.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t(`projects.${project.status}`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

