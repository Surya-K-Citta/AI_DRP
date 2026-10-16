// @ts-nocheck
import { useClusterFormText } from '@/lib/clusterDprFormText';
import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface DPRVisualizationsProps {
  data: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const DPRVisualizations: React.FC<DPRVisualizationsProps> = ({ data }) => {
  const tf = useClusterFormText();
  // Enterprise Count Chart
  const enterpriseData = data.step1?.enterpriseCount ? [
    { name: tf('Micro'), value: data.step1.enterpriseCount.micro || 0 },
    { name: tf('Small'), value: data.step1.enterpriseCount.small || 0 },
    { name: tf('Medium'), value: data.step1.enterpriseCount.medium || 0 },
  ] : [];

  // Market Served Pie Chart
  const marketData = data.step1?.marketServed ? [
    { name: tf('Domestic'), value: data.step1.marketServed.domestic || 0 },
    { name: tf('Export'), value: data.step1.marketServed.export || 0 },
  ] : [];

  // Project Cost Breakdown
  const costData = data.step12 ? [
    { name: tf('Land'), value: data.step12.land || 0 },
    { name: tf('Building'), value: data.step12.building || 0 },
    { name: tf('Machinery'), value: data.step12.machinery || 0 },
    { name: tf('Utilities'), value: data.step12.utilitiesAndInfrastructure || 0 },
    { name: tf('Preliminary'), value: data.step12.preliminaryAndPreOperative || 0 },
    { name: tf('Working Capital'), value: data.step12.workingCapitalMargin || 0 },
  ].filter(item => item.value > 0) : [];

  // Means of Finance
  const financeData = data.step13 ? [
    { name: tf('SPV Contribution'), value: data.step13.spvContribution || 0 },
    { name: tf('Government Grant'), value: data.step13.governmentGrant || 0 },
    { name: tf('Bank Loan'), value: data.step13.bankLoan || 0 },
    { name: tf('Other Sources'), value: data.step13.otherSources || 0 },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Enterprise Count Chart */}
      {enterpriseData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tf('Enterprise Distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enterpriseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Market Served Pie Chart */}
      {marketData.length > 0 && marketData.some(d => d.value > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{tf('Market Served Distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={marketData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {marketData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Project Cost Breakdown */}
      {costData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tf('Project Cost Breakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Means of Finance */}
      {financeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tf('Means of Finance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
