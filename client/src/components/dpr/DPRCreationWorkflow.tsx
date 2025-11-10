import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { CheckCircle, ArrowRight, Download, FileText, Clock, Users } from 'lucide-react';

interface DPRTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  structure: {
    totalSections: number;
    estimatedTime: string;
  };
  usageCount: number;
}

interface Question {
  id: string;
  question: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

interface Questionnaire {
  currentStep: number;
  totalSteps: number;
  currentSection: string;
  questions: Question[];
  progress: number;
  nextAction: string;
}

interface DPRSession {
  sessionId: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
  status: string;
}

const DPRCreationWorkflow: React.FC = () => {
  const [templates, setTemplates] = useState<DPRTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DPRTemplate | null>(null);
  const [session, setSession] = useState<DPRSession | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [generatedDPR, setGeneratedDPR] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'templates' | 'questionnaire' | 'generated'>('templates');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dpr/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const startDPRSession = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await api.post('/dpr/sessions/start', {
        templateId,
        language: 'english'
      });
      
      if (response.data.success) {
        setSession(response.data.data);
        setStep('questionnaire');
        loadCurrentStep(response.data.data.sessionId);
      }
    } catch (err: any) {
      setError('Failed to start DPR session');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentStep = async (sessionId: string) => {
    try {
      const response = await api.get(`/dpr/sessions/${sessionId}/step`);
      if (response.data.success) {
        setQuestionnaire(response.data.data.questionnaire);
        setSession(response.data.data.session);
      }
    } catch (err: any) {
      setError('Failed to load current step');
    }
  };

  const submitResponses = async () => {
    if (!session || !questionnaire) return;

    try {
      setLoading(true);
      const response = await api.post(`/dpr/sessions/${session.sessionId}/responses`, {
        responses
      });

      if (response.data.success) {
        if (response.data.data.status === 'completed') {
          setGeneratedDPR(response.data.data.generatedDPR);
          setStep('generated');
        } else {
          // Move to next step
          setSession(response.data.data);
          setResponses({});
          loadCurrentStep(session.sessionId);
        }
      }
    } catch (err: any) {
      setError('Failed to submit responses');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderQuestion = (question: Question) => {
    const commonProps = {
      value: responses[question.id] || '',
      onChange: (e: any) => handleResponseChange(question.id, e.target.value),
      placeholder: question.placeholder,
      required: question.required,
    };

    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        );
      case 'select':
        return (
          <select
            {...commonProps}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      default:
        return (
          <Input
            {...commonProps}
            className="w-full"
          />
        );
    }
  };

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a DPR Template</h2>
        <p className="text-gray-600">Select a template to start creating your Detailed Project Report</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template._id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-sm text-gray-500 capitalize">{template.category}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {template.structure.estimatedTime}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {template.usageCount} uses
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mb-4">
              {template.structure.totalSections} sections
            </div>
            
            <Button
              onClick={() => {
                setSelectedTemplate(template);
                startDPRSession(template._id);
              }}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Starting...' : 'Start DPR Creation'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderQuestionnaire = () => (
    <div className="space-y-6">
      {questionnaire && (
        <>
          {/* Progress Bar */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {questionnaire.currentSection}
              </h2>
              <span className="text-sm text-gray-500">
                Step {questionnaire.currentStep} of {questionnaire.totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${questionnaire.progress}%` }}
              />
            </div>
          </div>

          {/* Questions */}
          <Card className="p-6">
            <div className="space-y-6">
              {questionnaire.questions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {question.helpText && (
                    <p className="text-sm text-gray-500 mb-2">{question.helpText}</p>
                  )}
                  {renderQuestion(question)}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={submitResponses}
                disabled={loading}
                className="flex items-center"
              >
                {loading ? 'Saving...' : questionnaire.nextAction}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );

  const renderGeneratedDPR = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">DPR Generated Successfully!</h2>
        <p className="text-gray-600">Your Detailed Project Report is ready for download</p>
      </div>

      {generatedDPR && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Generated DPR</h3>
              <div className="text-sm text-gray-500">
                {generatedDPR.metadata.wordCount} words • {generatedDPR.sections.length} sections
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {generatedDPR.dprContent}
              </pre>
            </div>
            
            <div className="flex space-x-4">
              <Button className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Download DOCX
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 'templates' && renderTemplates()}
      {step === 'questionnaire' && renderQuestionnaire()}
      {step === 'generated' && renderGeneratedDPR()}
    </div>
  );
};

export default DPRCreationWorkflow;

