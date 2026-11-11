// @ts-nocheck
import { useBackTarget } from '@/lib/navHistory';
import { BackButton } from '@/components/ui/BackButton';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { useProjectStore } from '@/store/projectStore';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const ProjectForm: React.FC = () => {
  const { t } = useTranslation();
  const tf = useClusterFormText();
  const navigate = useNavigate();
  const back = useBackTarget({ path: '/projects' });
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
      toast.error(t('projects.failedToLoadProject'));
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
      toast.error(id ? t('projects.failedToUpdateProject') : t('projects.failedToCreateProject'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <BackButton label={back.label} onClick={back.go} />

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white mb-6">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              {id ? t('projects.editProject') : t('projects.create')}
            </h1>
            <p className="text-white/90">
              {id ? t('projects.updateProjectDetails') : t('projects.createNewProjectStart')}
            </p>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {t('projects.projectInformation')}
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
                <label htmlFor="project-type" className="block text-sm font-medium mb-2">
                  {t('projects.projectType')}
                </label>
                <select
                  id="project-type"
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

              <div>
                <label htmlFor="project-sector" className="block text-sm font-medium mb-2">
                  {t('projects.industrySector')} *
                </label>
                <select
                  id="project-sector"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.industrySector}
                  onChange={(e) =>
                    setFormData({ ...formData, industrySector: e.target.value })
                  }
                  required
                >
                  <option value="">{t('projects.selectIndustrySector')}</option>
                  <option value="Manufacturing">{tf('Manufacturing')}</option>
                  <option value="Services">{tf('Services')}</option>
                  <option value="Trading">{tf('Trading')}</option>
                  <option value="Food Processing">{tf('Food Processing')}</option>
                  <option value="Textiles & Garments">{tf('Textiles & Garments')}</option>
                  <option value="Handicrafts">{tf('Handicrafts')}</option>
                  <option value="IT & ITES">{tf('IT & ITES')}</option>
                  <option value="Healthcare">{tf('Healthcare')}</option>
                  <option value="Education">{tf('Education')}</option>
                  <option value="Agriculture & Allied">{tf('Agriculture & Allied')}</option>
                  <option value="Construction">{tf('Construction')}</option>
                  <option value="Retail">{tf('Retail')}</option>
                  <option value="Hospitality & Tourism">{tf('Hospitality & Tourism')}</option>
                  <option value="Transport & Logistics">{tf('Transport & Logistics')}</option>
                  <option value="Real Estate">{tf('Real Estate')}</option>
                  <option value="Energy & Power">{tf('Energy & Power')}</option>
                  <option value="Chemicals & Pharmaceuticals">{tf('Chemicals & Pharmaceuticals')}</option>
                  <option value="Metal & Engineering">{tf('Metal & Engineering')}</option>
                  <option value="Leather & Leather Products">{tf('Leather & Leather Products')}</option>
                  <option value="Paper & Paper Products">{tf('Paper & Paper Products')}</option>
                  <option value="Rubber & Plastic Products">{tf('Rubber & Plastic Products')}</option>
                  <option value="Wood & Wood Products">{tf('Wood & Wood Products')}</option>
                  <option value="Printing & Publishing">{tf('Printing & Publishing')}</option>
                  <option value="Electronics & Electrical">{tf('Electronics & Electrical')}</option>
                  <option value="Gems & Jewellery">{tf('Gems & Jewellery')}</option>
                  <option value="Other">{tf('Other')}</option>
                </select>
              </div>

              <Input
                label={t('projects.subSector')}
                value={formData.subSector}
                onChange={(e) =>
                  setFormData({ ...formData, subSector: e.target.value })
                }
                placeholder={tf('e.g., Textile, Food Processing')}
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
                placeholder={tf('City, State')}
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
                  placeholder={t('projects.describeBusiness')}
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
                  placeholder={t('projects.describeTargetMarket')}
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
                  variant="secondary"
                  className="flex-1 shadow-lg" 
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

