import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useProjectStore } from '@/store/projectStore';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export const ProjectForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { addProject, updateProject } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'individual' as 'individual' | 'cluster',
    industrySector: '',
    subSector: '',
    totalCost: '',
    ownContribution: '',
    loanAmount: '',
    location: '',
    inputs: {
      businessDescription: '',
      targetMarket: '',
    },
  });

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await api.getProject(id!);
      const project = response.data;
      setFormData({
        projectName: project.projectName,
        projectType: project.projectType,
        industrySector: project.industrySector,
        subSector: project.subSector || '',
        totalCost: project.totalCost.toString(),
        ownContribution: project.ownContribution.toString(),
        loanAmount: project.loanAmount.toString(),
        location: project.location,
        inputs: project.inputs || { businessDescription: '', targetMarket: '' },
      });
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        totalCost: parseFloat(formData.totalCost),
        ownContribution: parseFloat(formData.ownContribution),
        loanAmount: parseFloat(formData.loanAmount),
      };

      if (id) {
        const response = await api.updateProject(id, data);
        updateProject(id, response.data);
        toast.success(t('projects.updateSuccess'));
      } else {
        const response = await api.createProject(data);
        addProject(response.data);
        toast.success(t('projects.createSuccess'));
      }
      
      navigate('/projects');
    } catch (error) {
      toast.error(id ? 'Failed to update project' : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 text-white mb-6">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              {id ? 'Edit Project' : t('projects.create')}
            </h1>
            <p className="text-white/90">
              {id ? 'Update your project details' : 'Create a new project to start generating DPRs'}
            </p>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('projects.projectName')}
                value={formData.projectName}
                onChange={(e) =>
                  setFormData({ ...formData, projectName: e.target.value })
                }
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('projects.projectType')}
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.projectType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      projectType: e.target.value as 'individual' | 'cluster',
                    })
                  }
                  required
                >
                  <option value="individual">{t('projects.individual')}</option>
                  <option value="cluster">{t('projects.cluster')}</option>
                </select>
              </div>

              <Input
                label={t('projects.industrySector')}
                value={formData.industrySector}
                onChange={(e) =>
                  setFormData({ ...formData, industrySector: e.target.value })
                }
                placeholder="e.g., Manufacturing, Services, Trading"
                required
              />

              <Input
                label="Sub-Sector (Optional)"
                value={formData.subSector}
                onChange={(e) =>
                  setFormData({ ...formData, subSector: e.target.value })
                }
                placeholder="e.g., Textile, Food Processing"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={t('projects.totalCost')}
                  type="number"
                  value={formData.totalCost}
                  onChange={(e) =>
                    setFormData({ ...formData, totalCost: e.target.value })
                  }
                  placeholder="0"
                  required
                />
                <Input
                  label={t('projects.ownContribution')}
                  type="number"
                  value={formData.ownContribution}
                  onChange={(e) =>
                    setFormData({ ...formData, ownContribution: e.target.value })
                  }
                  placeholder="0"
                  required
                />
                <Input
                  label={t('projects.loanAmount')}
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, loanAmount: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>

              <Input
                label={t('projects.location')}
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="City, State"
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('projects.businessDescription')}
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.inputs.businessDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inputs: {
                        ...formData.inputs,
                        businessDescription: e.target.value,
                      },
                    })
                  }
                  placeholder="Describe your business idea..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('projects.targetMarket')}
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.inputs.targetMarket}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inputs: {
                        ...formData.inputs,
                        targetMarket: e.target.value,
                      },
                    })
                  }
                  placeholder="Describe your target market..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => navigate('/projects')}
                  className="flex-1 border-2"
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg" 
                  isLoading={isLoading}
                >
                  {id ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

