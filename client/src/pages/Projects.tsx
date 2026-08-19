// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { isSuperAdmin } from '@/lib/rbac';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Trash2, Edit, FileText, Building2, Sparkles, ArrowRight, Users } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Projects: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user?.role);
  const { projects, setProjects, deleteProject, isStale } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    // Use cached data if available and not stale
    if (projects.length > 0 && !isStale()) {
      console.log('📦 Using cached projects data');
      return;
    }

    setIsLoading(true);
    try {
      if (isAdmin) {
        const response = await api.getAllProjects({ limit: 100 });
        setProjects(response.data.projects || []);
      } else {
        const response = await api.getProjects();
        setProjects(response.data.projects);
      }
    } catch (error) {
      toast.error(t('projects.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('projects.areYouSureDelete'))) return;

    try {
      await api.deleteProject(id);
      deleteProject(id);
      toast.success(t('projects.deleteSuccess'));
    } catch (error) {
      toast.error(t('projects.failedToDelete'));
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.industrySector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              {isAdmin ? t('projects.allProjects') : t('projects.title')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isAdmin 
                ? t('projects.viewManageAll')
                : t('projects.managePortfolio')
              }
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dpr/builder')}
              className="border-2"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('projects.newDPR')}
            </Button>
            <Button 
              onClick={() => navigate('/projects/create')}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('projects.create')}
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <Input
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? t('projects.noProjectsFound') : t('projects.noProjectsYet')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? t('projects.tryAdjusting') 
                  : t('projects.createFirstProject')}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => navigate('/projects/create')}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/90"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t('projects.createYourFirstProject')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project._id} 
                className="hover:shadow-xl transition-all border-2 hover:border-primary/50 group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        project.status === 'completed'
                          ? 'bg-success/10 text-success border-success/20'
                          : project.status === 'in-progress'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {t(`projects.${project.status}`)}
                    </span>
                  </div>
                  <CardTitle className="text-xl mb-1">{project.projectName}</CardTitle>
                  <CardDescription className="text-base">
                    {project.industrySector}
                  </CardDescription>
                  {isAdmin && project.userId && (
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {typeof project.userId === 'object' 
                          ? project.userId.name || project.userId.email
                          : t('projects.unknownUser')
                        }
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">{t('projects.totalCost')}</p>
                      <p className="font-bold text-primary">{formatCurrency(project.totalCost)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                      <p className="text-xs text-muted-foreground mb-1">{t('projects.location')}</p>
                      <p className="font-semibold text-secondary text-sm">{project.location}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('projects.created')} {formatDate(project.createdAt)}
                  </p>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-2 hover:bg-primary/5 hover:border-primary"
                      onClick={() => navigate(`/projects/${project._id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-2 hover:bg-secondary/5 hover:border-secondary"
                      onClick={() => navigate(`/dpr/builder/${project._id}`)}
                      title="Create DPR for this project"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      DPR
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(project._id)}
                      className="border-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
