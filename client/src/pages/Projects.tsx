// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { isSuperAdmin } from '@/lib/rbac';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Trash2, Edit, FileText, Building2, Sparkles, ArrowRight, Users, Wand2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const Projects: React.FC = () => {
  const { t } = useTranslation();
  const tf = useClusterFormText();
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

  const costOf = (project: any) => (Number(project.totalCost) > 0 ? formatCurrency(project.totalCost) : null);
  const statusStyle = (status: string) =>
    status === 'completed'
      ? 'bg-success/10 text-success-text border-success/20'
      : status === 'in-progress'
      ? 'bg-warning/10 text-warning-text border-warning/20'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <Layout>
      <div className="space-y-5 pb-8 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">{isAdmin ? t('projects.allProjects') : t('projects.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin ? t('projects.viewManageAll') : t('projects.managePortfolio')}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button onClick={() => navigate('/projects/create')} className="gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('projects.create')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/individual-dpr/create?new=true')} className="gap-2 whitespace-nowrap border-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {tf('Create DPR')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/venture-match')} className="gap-2 whitespace-nowrap border-2">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.ventureMatch')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/individual-dpr/guide')} className="gap-2 whitespace-nowrap border-2">
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              {t('reportGuide.open')}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder={t('common.search')}
              aria-label={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          {!isLoading && (
            <p className="text-sm text-muted-foreground" role="status">
              {filteredProjects.length} {filteredProjects.length === 1 ? t('dashboard.project') : t('dashboard.projects')}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label={t('common.loading')}>
            {[0, 1, 2].map((n) => <div key={n} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-16 text-center">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
              <Building2 className="h-8 w-8" />
            </span>
            <h2 className="mb-2 text-xl font-semibold">{searchTerm ? t('projects.noProjectsFound') : t('projects.noProjectsYet')}</h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              {searchTerm ? t('projects.tryAdjusting') : t('projects.createFirstProject')}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/projects/create')} size="lg" className="gap-2">
                <Plus className="h-5 w-5" aria-hidden="true" />
                {t('projects.createYourFirstProject')}
              </Button>
            )}
          </div>
        ) : (
          <ul className="motion-stagger grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <li key={project._id} className="min-w-0">
                <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(project.status)}`}>
                      {t(`projects.${project.status}`)}
                    </span>
                  </div>

                  <h2 className="mt-3 break-words text-lg font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">{project.projectName}</h2>
                  <p className="text-sm text-muted-foreground">{tf(String(project.industrySector ?? ''))}</p>
                  {isAdmin && project.userId && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 flex-none" aria-hidden="true" />
                      <span className="min-w-0 truncate">
                        {typeof project.userId === 'object' ? project.userId.name || project.userId.email : t('projects.unknownUser')}
                      </span>
                    </p>
                  )}

                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/50 px-3 py-2.5">
                      <dt className="text-xs text-muted-foreground">{t('projects.totalCost')}</dt>
                      <dd className={`mt-0.5 text-sm font-semibold ${costOf(project) ? 'text-foreground' : 'font-normal text-muted-foreground'}`}>
                        {costOf(project) ?? tf('Not entered')}
                      </dd>
                    </div>
                    <div className="min-w-0 rounded-xl bg-muted/50 px-3 py-2.5">
                      <dt className="text-xs text-muted-foreground">{t('projects.location')}</dt>
                      <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">{project.location || '—'}</dd>
                    </div>
                  </dl>
                  <p className="mb-4 mt-3 text-xs text-muted-foreground">
                    {t('projects.created')} {formatDate(project.createdAt)}
                  </p>

                  <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => navigate(`/projects/${project._id}`)}>
                      <Edit className="h-4 w-4" aria-hidden="true" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => navigate('/individual-dpr/create?new=true')}
                      title={tf('Create DPR')}
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      DPR
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project._id)}
                      aria-label={`${t('common.delete', { defaultValue: 'Delete' })} ${project.projectName}`}
                      title={t('common.delete', { defaultValue: 'Delete' })}
                      data-confirm-title={t('confirmDelete.projectTitle', { defaultValue: 'Delete this project?' })}
                      data-confirm-body={t('confirmDelete.projectBody', { name: project.projectName, defaultValue: '“{{name}}” and its reports will be removed. This cannot be undone.' })}
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-destructive/30 text-destructive-text transition-colors hover:bg-destructive/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};
