// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Building2,
  Sparkles,
  FileText,
  TrendingUp,
  Globe,
  Shield,
  ArrowRight,
  LogIn,
  UserPlus,
  Zap,
  BarChart3,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  Award,
  Clock,
  Users,
  Target,
} from 'lucide-react';

export const Landing: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered DPR Creation',
      description: 'Step-by-step guidance for creating professional, bank-ready Detailed Project Reports with intelligent automation',
    },
    {
      icon: Globe,
      title: 'Bilingual Support',
      description: 'Generate DPRs in English, Telugu, or both languages seamlessly for wider accessibility',
    },
    {
      icon: FileCheck,
      title: 'Bank-Ready Quality',
      description: 'Optimized for bank approval with industry-standard formatting, compliance, and comprehensive analytics',
    },
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Intelligent guidance with voice input support for effortless data entry and real-time assistance',
    },
    {
      icon: TrendingUp,
      title: 'Financial Suggestions',
      description: 'Auto-suggests financial data, cost structures, and sector benchmarks based on industry standards',
    },
    {
      icon: Shield,
      title: 'Scheme Recommendations',
      description: 'AI-powered scheme matching from AP MSME ONE Portal with eligibility verification',
    },
    {
      icon: BarChart3,
      title: 'Quality Analytics',
      description: 'Comprehensive DPR quality assessment, bankability analysis, and performance metrics',
    },
    {
      icon: Zap,
      title: 'Fast Track Export',
      description: 'Export to PDF and DOCX formats with professional formatting for quick submission',
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce DPR creation time from weeks to hours with AI-powered automation',
    },
    {
      icon: Award,
      title: 'Increase Approval Rates',
      description: 'Bank-ready quality reports that meet all regulatory and financial institution requirements',
    },
    {
      icon: Target,
      title: 'Accurate Projections',
      description: 'Data-driven financial projections and market analysis for better decision making',
    },
    {
      icon: Users,
      title: 'Expert Guidance',
      description: 'AI-powered recommendations based on industry best practices and successful projects',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">MSME DPR Tool</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Create Professional, Bank-Ready
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Detailed Project Reports
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              AI-powered platform that guides entrepreneurs step-by-step to create comprehensive DPRs
              with extensive analytics and government scheme integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empowering MSMEs with cutting-edge technology to secure funding and grow their businesses
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={index}
                  className="p-6 text-center hover:shadow-lg transition-all duration-300 border hover:border-primary/30"
                >
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-muted/30 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create professional DPRs and secure funding for your business
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-xl transition-all duration-300 border hover:border-primary/30 bg-white"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, streamlined process to create your Detailed Project Report
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Create Account</h3>
                <p className="text-muted-foreground">
                  Sign up for free and set up your profile in minutes
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Build Your Project</h3>
                <p className="text-muted-foreground">
                  Use our AI-guided builder to input your project details
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Generate & Export</h3>
                <p className="text-muted-foreground">
                  Get your bank-ready DPR in PDF or DOCX format instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-white to-secondary/10">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 border-primary/20 shadow-xl bg-white">
            <div className="p-8 md:p-12 text-center">
              <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Ready to Create Your DPR?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of entrepreneurs who have successfully created bank-ready DPRs
                and secured funding with our AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-foreground">MSME DPR Tool</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © 2024 AI-Enabled MSME DPR Generation Tool. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
