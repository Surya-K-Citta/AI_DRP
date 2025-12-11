// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Info, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Step 1: Data Input Sheet
export const DataInputSheetStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Data Input Sheet</h3>
        <p className="text-sm text-muted-foreground">
          Provide basic information about your project, sponsoring agency, and personal details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Preference for Sponsoring Agency *</label>
          <select
            value={data?.sponsoringAgency || ''}
            onChange={(e) => onChange({...data, sponsoringAgency: e.target.value})}
            className="w-full h-12 px-4 border-2 rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
          >
            <option value="">Select Agency</option>
            <option value="KVIC">KVIC (Khadi and Village Industries Commission)</option>
            <option value="KVIB">KVIB (Khadi and Village Industries Board)</option>
            <option value="DIC">DIC (District Industries Centre)</option>
            <option value="COIR Board">COIR Board</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Unit Location *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="unitLocation"
                value="rural"
                checked={data?.unitLocation === 'rural'}
                onChange={(e) => onChange({...data, unitLocation: e.target.value})}
                className="w-4 h-4"
              />
              <span>Rural</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="unitLocation"
                value="urban"
                checked={data?.unitLocation === 'urban'}
                onChange={(e) => onChange({...data, unitLocation: e.target.value})}
                className="w-4 h-4"
              />
              <span>Urban</span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">Name of the Applicant/Institution *</label>
          <Input
            value={data?.applicantName || ''}
            onChange={(e) => onChange({...data, applicantName: e.target.value})}
            placeholder="Enter full name"
            className="h-12 border-2 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Gender *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={data?.gender === 'male'}
                onChange={(e) => onChange({...data, gender: e.target.value})}
                className="w-4 h-4"
              />
              <span>Male</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={data?.gender === 'female'}
                onChange={(e) => onChange({...data, gender: e.target.value})}
                className="w-4 h-4"
              />
              <span>Female</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="transgender"
                checked={data?.gender === 'transgender'}
                onChange={(e) => onChange({...data, gender: e.target.value})}
                className="w-4 h-4"
              />
              <span>Transgender</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Project Type *</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="projectType"
                value="manufacturing"
                checked={data?.projectType === 'manufacturing'}
                onChange={(e) => onChange({...data, projectType: e.target.value})}
                className="w-4 h-4"
              />
              <span>Manufacturing Unit</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="projectType"
                value="service"
                checked={data?.projectType === 'service'}
                onChange={(e) => onChange({...data, projectType: e.target.value})}
                className="w-4 h-4"
              />
              <span>Service Unit</span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">Address of Proposed Location *</label>
          <div className="space-y-3">
            <Input
              value={data?.address?.street || ''}
              onChange={(e) => onChange({...data, address: {...data?.address, street: e.target.value}})}
              placeholder="Street Address"
              className="h-12 border-2 focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={data?.address?.village || ''}
                onChange={(e) => onChange({...data, address: {...data?.address, village: e.target.value}})}
                placeholder="Village/Town"
                className="h-12 border-2 focus:border-primary"
              />
              <Input
                value={data?.address?.taluk || ''}
                onChange={(e) => onChange({...data, address: {...data?.address, taluk: e.target.value}})}
                placeholder="Taluk/Block"
                className="h-12 border-2 focus:border-primary"
              />
              <Input
                value={data?.address?.district || ''}
                onChange={(e) => onChange({...data, address: {...data?.address, district: e.target.value}})}
                placeholder="District"
                className="h-12 border-2 focus:border-primary"
              />
              <Input
                value={data?.address?.pin || ''}
                onChange={(e) => onChange({...data, address: {...data?.address, pin: e.target.value}})}
                placeholder="PIN Code"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="email"
                value={data?.address?.email || ''}
                onChange={(e) => onChange({...data, address: {...data?.address, email: e.target.value}})}
                placeholder="E-Mail"
                className="h-12 border-2 focus:border-primary"
              />
              <Input
                value={data?.address?.mobile || ''}
                onChange={(e) => onChange({...data, address: {...data?.address, mobile: e.target.value}})}
                placeholder="Mobile Number"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-foreground">Social Category (mark all applicable)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['SC', 'ST', 'OBC', 'PHC', 'Ex-Service man', 'Minority', 'Hill Border Area'].map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data?.socialCategory?.includes(cat) || false}
                  onChange={(e) => {
                    const current = data?.socialCategory || [];
                    const updated = e.target.checked
                      ? [...current, cat]
                      : current.filter((c: string) => c !== cat);
                    onChange({...data, socialCategory: updated});
                  }}
                  className="w-4 h-4"
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Legal Status *</label>
          <select
            value={data?.legalStatus || ''}
            onChange={(e) => onChange({...data, legalStatus: e.target.value})}
            className="w-full h-12 px-4 border-2 rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
          >
            <option value="">Select Legal Status</option>
            <option value="Individual">Individual</option>
            <option value="Partnership Firm">Partnership Firm</option>
            <option value="Private Limited Company">Private Limited Company</option>
            <option value="Public Limited Company">Public Limited Company</option>
            <option value="LLP">Limited Liability Partnership (LLP)</option>
            <option value="Trust">Trust</option>
            <option value="Society">Society</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">PAN Number</label>
          <Input
            value={data?.panNumber || ''}
            onChange={(e) => onChange({...data, panNumber: e.target.value})}
            placeholder="Enter PAN Number"
            className="h-12 border-2 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">GST Number (if applicable)</label>
          <Input
            value={data?.gstNumber || ''}
            onChange={(e) => onChange({...data, gstNumber: e.target.value})}
            placeholder="Enter GST Number"
            className="h-12 border-2 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Aadhaar Number</label>
          <Input
            value={data?.aadhaarNumber || ''}
            onChange={(e) => onChange({...data, aadhaarNumber: e.target.value})}
            placeholder="Enter Aadhaar Number"
            className="h-12 border-2 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Step 2: Land & Building Details
export const LandBuildingStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const [buildingRows, setBuildingRows] = useState(data?.buildingDetails || [{ floor: '', area: '', ratePerSqft: '', amount: '' }]);

  const updateBuildingRow = (index: number, field: string, value: string) => {
    const updated = [...buildingRows];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'area' || field === 'ratePerSqft') {
      const area = parseFloat(updated[index].area || '0');
      const rate = parseFloat(updated[index].ratePerSqft || '0');
      updated[index].amount = (area * rate).toString();
    }
    setBuildingRows(updated);
    onChange({...data, buildingDetails: updated});
  };

  const addBuildingRow = () => {
    setBuildingRows([...buildingRows, { floor: '', area: '', ratePerSqft: '', amount: '' }]);
  };

  const removeBuildingRow = (index: number) => {
    if (buildingRows.length > 1) {
      const updated = buildingRows.filter((_: any, i: number) => i !== index);
      setBuildingRows(updated);
      onChange({...data, buildingDetails: updated});
    }
  };

  const totalBuildingCost = buildingRows.reduce((sum, row) => sum + parseFloat(row.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Land & Building Details</h3>
        <p className="text-sm text-muted-foreground">
          Provide details about land ownership and building construction costs.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Land Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Land Ownership Status *</label>
            <div className="flex gap-4 flex-wrap">
              {['owned', 'leased', 'rented', 'to_be_purchased'].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="landOwnership"
                    value={status}
                    checked={data?.landOwnership === status}
                    onChange={(e) => onChange({...data, landOwnership: e.target.value})}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Total Land Area</label>
              <Input
                value={data?.landArea || ''}
                onChange={(e) => onChange({...data, landArea: e.target.value})}
                placeholder="Enter area in Sq.ft or Acres"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Land Cost (₹)</label>
              <Input
                type="number"
                value={data?.landCost || ''}
                onChange={(e) => onChange({...data, landCost: e.target.value})}
                placeholder="Enter land cost"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Building Details</CardTitle>
          <Button onClick={addBuildingRow} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Floor
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Particulars</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Area (Sq.ft)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Rate/Sq.ft (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Amount (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {buildingRows.map((row: any, index: number) => (
                  <tr key={index}>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        value={row.floor}
                        onChange={(e) => updateBuildingRow(index, 'floor', e.target.value)}
                        placeholder="e.g., Ground Floor"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={row.area}
                        onChange={(e) => updateBuildingRow(index, 'area', e.target.value)}
                        placeholder="Area"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={row.ratePerSqft}
                        onChange={(e) => updateBuildingRow(index, 'ratePerSqft', e.target.value)}
                        placeholder="Rate"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={row.amount}
                        readOnly
                        className="h-10 border-2 bg-muted"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      {buildingRows.length > 1 && (
                        <Button
                          onClick={() => removeBuildingRow(index)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={3} className="border-2 border-primary/20 p-3 text-right">TOTAL BUILDING COST</td>
                  <td className="border-2 border-primary/20 p-3">₹{totalBuildingCost.toLocaleString('en-IN')}</td>
                  <td className="border-2 border-primary/20 p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 3: Machinery & Equipment
export const MachineryEquipmentStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const [machineryItems, setMachineryItems] = useState(data?.items || [{ name: '', quantity: '', rate: '', amount: '' }]);

  const updateMachineryItem = (index: number, field: string, value: string) => {
    const updated = [...machineryItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(updated[index].quantity || '0');
      const rate = parseFloat(updated[index].rate || '0');
      updated[index].amount = (qty * rate).toString();
    }
    setMachineryItems(updated);
    onChange({...data, items: updated});
  };

  const addMachineryItem = () => {
    setMachineryItems([...machineryItems, { name: '', quantity: '', rate: '', amount: '' }]);
  };

  const removeMachineryItem = (index: number) => {
    if (machineryItems.length > 1) {
      const updated = machineryItems.filter((_: any, i: number) => i !== index);
      setMachineryItems(updated);
      onChange({...data, items: updated});
    }
  };

  const totalMachineryCost = machineryItems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Machinery & Equipment Details</h3>
        <p className="text-sm text-muted-foreground">
          List all machinery and equipment required for your project.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Machinery Details</CardTitle>
          <Button onClick={addMachineryItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Machinery
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Particulars</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Quantity</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Rate (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Amount (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {machineryItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        value={item.name}
                        onChange={(e) => updateMachineryItem(index, 'name', e.target.value)}
                        placeholder="e.g., CNC Machine"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateMachineryItem(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateMachineryItem(index, 'rate', e.target.value)}
                        placeholder="Rate"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="h-10 border-2 bg-muted"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      {machineryItems.length > 1 && (
                        <Button
                          onClick={() => removeMachineryItem(index)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={3} className="border-2 border-primary/20 p-3 text-right">TOTAL MACHINERY COST</td>
                  <td className="border-2 border-primary/20 p-3">₹{totalMachineryCost.toLocaleString('en-IN')}</td>
                  <td className="border-2 border-primary/20 p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-secondary/20">
        <CardHeader>
          <CardTitle>Additional Capital Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Preliminary & Pre-operative Cost (₹)</label>
            <Input
              type="number"
              value={data?.preliminaryCost || ''}
              onChange={(e) => onChange({...data, preliminaryCost: e.target.value})}
              placeholder="Registration, legal fees, project report preparation"
              className="h-12 border-2 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Furniture & Fixtures (₹)</label>
            <Input
              type="number"
              value={data?.furnitureFixtures || ''}
              onChange={(e) => onChange({...data, furnitureFixtures: e.target.value})}
              placeholder="Office furniture, fixtures, fittings"
              className="h-12 border-2 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Contingency/Others/Miscellaneous (₹)</label>
            <Input
              type="number"
              value={data?.contingency || ''}
              onChange={(e) => onChange({...data, contingency: e.target.value})}
              placeholder="Typically 5-10% of project cost"
              className="h-12 border-2 focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 4: Means of Financing
export const FinancingStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const calculateTotal = () => {
    const own = parseFloat(data?.ownContribution || '0');
    const bank = parseFloat(data?.bankFinance || '0');
    const margin = parseFloat(data?.marginMoney || '0');
    return own + bank + margin;
  };

  const calculatePercentages = () => {
    const total = calculateTotal();
    if (total === 0) return { own: 0, bank: 0, margin: 0 };
    return {
      own: ((parseFloat(data?.ownContribution || '0') / total) * 100).toFixed(2),
      bank: ((parseFloat(data?.bankFinance || '0') / total) * 100).toFixed(2),
      margin: ((parseFloat(data?.marginMoney || '0') / total) * 100).toFixed(2),
    };
  };

  const percentages = calculatePercentages();

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Means of Financing</h3>
        <p className="text-sm text-muted-foreground">
          Define how your project will be financed. Percentages should add up to 100%.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Financing Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Own Contribution (₹)</label>
            <Input
              type="number"
              value={data?.ownContribution || ''}
              onChange={(e) => onChange({...data, ownContribution: e.target.value})}
              placeholder="Typically 5-25% of project cost"
              className="h-12 border-2 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Percentage: {percentages.own}%</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Bank Finance (₹)</label>
            <Input
              type="number"
              value={data?.bankFinance || ''}
              onChange={(e) => onChange({...data, bankFinance: e.target.value})}
              placeholder="Typically 70-90% of project cost"
              className="h-12 border-2 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Percentage: {percentages.bank}%</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Margin Money (Govt. Subsidy) (₹)</label>
            <Input
              type="number"
              value={data?.marginMoney || ''}
              onChange={(e) => onChange({...data, marginMoney: e.target.value})}
              placeholder="Typically 15-35% of project cost"
              className="h-12 border-2 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Percentage: {percentages.margin}%</p>
          </div>
          <div className="pt-4 border-t-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-foreground">Total Project Cost:</span>
              <span className="text-2xl font-bold text-primary">₹{calculateTotal().toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Total Percentage: {(parseFloat(percentages.own) + parseFloat(percentages.bank) + parseFloat(percentages.margin)).toFixed(2)}%
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-secondary/20">
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Name of the Bank</label>
            <Input
              value={data?.bankName || ''}
              onChange={(e) => onChange({...data, bankName: e.target.value})}
              placeholder="Enter bank name"
              className="h-12 border-2 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Branch Name</label>
            <Input
              value={data?.branchName || ''}
              onChange={(e) => onChange({...data, branchName: e.target.value})}
              placeholder="Enter branch name"
              className="h-12 border-2 focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 5: Sales & Production
export const SalesProductionStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const [products, setProducts] = useState(data?.products || [{ name: '', ratePerUnit: '', quantity: '', amount: '' }]);

  const updateProduct = (index: number, field: string, value: string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'ratePerUnit' || field === 'quantity') {
      const rate = parseFloat(updated[index].ratePerUnit || '0');
      const qty = parseFloat(updated[index].quantity || '0');
      updated[index].amount = (rate * qty).toString();
    }
    setProducts(updated);
    onChange({...data, products: updated});
  };

  const addProduct = () => {
    setProducts([...products, { name: '', ratePerUnit: '', quantity: '', amount: '' }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      const updated = products.filter((_: any, i: number) => i !== index);
      setProducts(updated);
      onChange({...data, products: updated});
    }
  };

  const totalSales = products.reduce((sum, product) => sum + parseFloat(product.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Details of Sales</h3>
        <p className="text-sm text-muted-foreground">
          List all products/services you will sell with their rates and quantities.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Sales Details</CardTitle>
          <Button onClick={addProduct} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Particulars of Products</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Rate/Unit (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Quantity</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Amount (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: any, index: number) => (
                  <tr key={index}>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        value={product.name}
                        onChange={(e) => updateProduct(index, 'name', e.target.value)}
                        placeholder="e.g., Organic Turmeric Powder"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={product.ratePerUnit}
                        onChange={(e) => updateProduct(index, 'ratePerUnit', e.target.value)}
                        placeholder="Rate"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={product.amount}
                        readOnly
                        className="h-10 border-2 bg-muted"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      {products.length > 1 && (
                        <Button
                          onClick={() => removeProduct(index)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={3} className="border-2 border-primary/20 p-3 text-right">TOTAL SALES</td>
                  <td className="border-2 border-primary/20 p-3">₹{totalSales.toLocaleString('en-IN')}</td>
                  <td className="border-2 border-primary/20 p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 6: Raw Materials
export const RawMaterialsStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const [rawMaterials, setRawMaterials] = useState(data?.items || [{ name: '', unit: '', ratePerUnit: '', requiredUnits: '', amount: '' }]);

  const updateRawMaterial = (index: number, field: string, value: string) => {
    const updated = [...rawMaterials];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'ratePerUnit' || field === 'requiredUnits') {
      const rate = parseFloat(updated[index].ratePerUnit || '0');
      const units = parseFloat(updated[index].requiredUnits || '0');
      updated[index].amount = (rate * units).toString();
    }
    setRawMaterials(updated);
    onChange({...data, items: updated});
  };

  const addRawMaterial = () => {
    setRawMaterials([...rawMaterials, { name: '', unit: '', ratePerUnit: '', requiredUnits: '', amount: '' }]);
  };

  const removeRawMaterial = (index: number) => {
    if (rawMaterials.length > 1) {
      const updated = rawMaterials.filter((_: any, i: number) => i !== index);
      setRawMaterials(updated);
      onChange({...data, items: updated});
    }
  };

  const totalRawMaterialCost = rawMaterials.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Raw Materials</h3>
        <p className="text-sm text-muted-foreground">
          List all raw materials required for production with their units and costs.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Raw Material Requirements</CardTitle>
          <Button onClick={addRawMaterial} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Raw Material
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Particulars</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Unit</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Rate/Unit (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Required Units</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Amount (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rawMaterials.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        value={item.name}
                        onChange={(e) => updateRawMaterial(index, 'name', e.target.value)}
                        placeholder="e.g., Raw Turmeric"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        value={item.unit}
                        onChange={(e) => updateRawMaterial(index, 'unit', e.target.value)}
                        placeholder="Kg/Ltr/Pcs"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.ratePerUnit}
                        onChange={(e) => updateRawMaterial(index, 'ratePerUnit', e.target.value)}
                        placeholder="Rate"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.requiredUnits}
                        onChange={(e) => updateRawMaterial(index, 'requiredUnits', e.target.value)}
                        placeholder="Units"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="h-10 border-2 bg-muted"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      {rawMaterials.length > 1 && (
                        <Button
                          onClick={() => removeRawMaterial(index)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={4} className="border-2 border-primary/20 p-3 text-right">TOTAL RAW MATERIAL COST</td>
                  <td className="border-2 border-primary/20 p-3">₹{totalRawMaterialCost.toLocaleString('en-IN')}</td>
                  <td className="border-2 border-primary/20 p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 7: Wages & Labor
export const WagesLaborStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const [wageItems, setWageItems] = useState(data?.items || [{ category: '', numberOfWorkers: '', wagesPerMonth: '', amount: '' }]);

  const updateWageItem = (index: number, field: string, value: string) => {
    const updated = [...wageItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'numberOfWorkers' || field === 'wagesPerMonth') {
      const workers = parseFloat(updated[index].numberOfWorkers || '0');
      const wages = parseFloat(updated[index].wagesPerMonth || '0');
      updated[index].amount = (workers * wages * 12).toString(); // Annual
    }
    setWageItems(updated);
    onChange({...data, items: updated});
  };

  const addWageItem = () => {
    setWageItems([...wageItems, { category: '', numberOfWorkers: '', wagesPerMonth: '', amount: '' }]);
  };

  const removeWageItem = (index: number) => {
    if (wageItems.length > 1) {
      const updated = wageItems.filter((_: any, i: number) => i !== index);
      setWageItems(updated);
      onChange({...data, items: updated});
    }
  };

  const totalWages = wageItems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Wages Details</h3>
        <p className="text-sm text-muted-foreground">
          List all labor positions and their wages. Amounts are calculated annually (12 months).
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Wages Details</CardTitle>
          <Button onClick={addWageItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Labor Category
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Particulars</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">No. of Workers</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Wages Per Month (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Amount (₹) - Annual</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {wageItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        value={item.category}
                        onChange={(e) => updateWageItem(index, 'category', e.target.value)}
                        placeholder="e.g., Skilled Labor"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.numberOfWorkers}
                        onChange={(e) => updateWageItem(index, 'numberOfWorkers', e.target.value)}
                        placeholder="No."
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.wagesPerMonth}
                        onChange={(e) => updateWageItem(index, 'wagesPerMonth', e.target.value)}
                        placeholder="Monthly"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="h-10 border-2 bg-muted"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      {wageItems.length > 1 && (
                        <Button
                          onClick={() => removeWageItem(index)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={3} className="border-2 border-primary/20 p-3 text-right">TOTAL WAGES (Annual)</td>
                  <td className="border-2 border-primary/20 p-3">₹{totalWages.toLocaleString('en-IN')}</td>
                  <td className="border-2 border-primary/20 p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 8: Salary Details (similar to wages but for staff)
export const SalariesStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  const [salaryItems, setSalaryItems] = useState(data?.items || [{ position: '', numberOfStaff: '', salaryPerMonth: '', amount: '' }]);

  const updateSalaryItem = (index: number, field: string, value: string) => {
    const updated = [...salaryItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'numberOfStaff' || field === 'salaryPerMonth') {
      const staff = parseFloat(updated[index].numberOfStaff || '0');
      const salary = parseFloat(updated[index].salaryPerMonth || '0');
      updated[index].amount = (staff * salary * 12).toString(); // Annual
    }
    setSalaryItems(updated);
    onChange({...data, items: updated});
  };

  const addSalaryItem = () => {
    setSalaryItems([...salaryItems, { position: '', numberOfStaff: '', salaryPerMonth: '', amount: '' }]);
  };

  const removeSalaryItem = (index: number) => {
    if (salaryItems.length > 1) {
      const updated = salaryItems.filter((_: any, i: number) => i !== index);
      setSalaryItems(updated);
      onChange({...data, items: updated});
    }
  };

  const totalSalaries = salaryItems.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Salary Details</h3>
        <p className="text-sm text-muted-foreground">
          List all staff positions and their salaries. Amounts are calculated annually (12 months).
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Salary Details</CardTitle>
          <Button onClick={addSalaryItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Position
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Particulars</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">No. of Staff</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Salary Per Month (₹)</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Amount (₹) - Annual</th>
                  <th className="border-2 border-primary/20 p-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {salaryItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        value={item.position}
                        onChange={(e) => updateSalaryItem(index, 'position', e.target.value)}
                        placeholder="e.g., Manager"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.numberOfStaff}
                        onChange={(e) => updateSalaryItem(index, 'numberOfStaff', e.target.value)}
                        placeholder="No."
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.salaryPerMonth}
                        onChange={(e) => updateSalaryItem(index, 'salaryPerMonth', e.target.value)}
                        placeholder="Monthly"
                        className="h-10 border-2"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      <Input
                        type="number"
                        value={item.amount}
                        readOnly
                        className="h-10 border-2 bg-muted"
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-3">
                      {salaryItems.length > 1 && (
                        <Button
                          onClick={() => removeSalaryItem(index)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td colSpan={3} className="border-2 border-primary/20 p-3 text-right">TOTAL SALARY (Annual)</td>
                  <td className="border-2 border-primary/20 p-3">₹{totalSalaries.toLocaleString('en-IN')}</td>
                  <td className="border-2 border-primary/20 p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 9: Working Capital & Power
export const WorkingCapitalPowerStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Working Capital & Power Estimate</h3>
        <p className="text-sm text-muted-foreground">
          Calculate working capital requirements and power consumption estimates.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Working Capital Estimate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Stock in Process - Amount (₹)</label>
              <Input
                type="number"
                value={data?.stockInProcess?.amount || ''}
                onChange={(e) => onChange({...data, stockInProcess: {...data?.stockInProcess, amount: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">No. of Days</label>
              <Input
                type="number"
                value={data?.stockInProcess?.days || ''}
                onChange={(e) => onChange({...data, stockInProcess: {...data?.stockInProcess, days: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Finished Goods - Amount (₹)</label>
              <Input
                type="number"
                value={data?.finishedGoods?.amount || ''}
                onChange={(e) => onChange({...data, finishedGoods: {...data?.finishedGoods, amount: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">No. of Days</label>
              <Input
                type="number"
                value={data?.finishedGoods?.days || ''}
                onChange={(e) => onChange({...data, finishedGoods: {...data?.finishedGoods, days: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Receivables - Amount (₹)</label>
              <Input
                type="number"
                value={data?.receivables?.amount || ''}
                onChange={(e) => onChange({...data, receivables: {...data?.receivables, amount: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">No. of Days</label>
              <Input
                type="number"
                value={data?.receivables?.days || ''}
                onChange={(e) => onChange({...data, receivables: {...data?.receivables, days: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Sundry Creditors - Amount (₹)</label>
              <Input
                type="number"
                value={data?.sundryCreditors?.amount || ''}
                onChange={(e) => onChange({...data, sundryCreditors: {...data?.sundryCreditors, amount: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">No. of Days</label>
              <Input
                type="number"
                value={data?.sundryCreditors?.days || ''}
                onChange={(e) => onChange({...data, sundryCreditors: {...data?.sundryCreditors, days: e.target.value}})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-secondary/20">
        <CardHeader>
          <CardTitle>Power Estimate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Connected Load (KW)</label>
              <Input
                type="number"
                value={data?.connectedLoad || ''}
                onChange={(e) => onChange({...data, connectedLoad: e.target.value})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Sanctioned Load (KW)</label>
              <Input
                type="number"
                value={data?.sanctionedLoad || ''}
                onChange={(e) => onChange({...data, sanctionedLoad: e.target.value})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Monthly Consumption (Units)</label>
              <Input
                type="number"
                value={data?.monthlyConsumption || ''}
                onChange={(e) => {
                  const units = parseFloat(e.target.value || '0');
                  const rate = parseFloat(data?.ratePerUnit || '0');
                  const monthlyCost = units * rate;
                  const annualCost = monthlyCost * 12;
                  onChange({...data, monthlyConsumption: e.target.value, monthlyCost: monthlyCost.toString(), annualCost: annualCost.toString()});
                }}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Rate per Unit (₹)</label>
              <Input
                type="number"
                value={data?.ratePerUnit || ''}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value || '0');
                  const units = parseFloat(data?.monthlyConsumption || '0');
                  const monthlyCost = units * rate;
                  const annualCost = monthlyCost * 12;
                  onChange({...data, ratePerUnit: e.target.value, monthlyCost: monthlyCost.toString(), annualCost: annualCost.toString()});
                }}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Monthly Power Cost (₹)</label>
              <Input
                type="number"
                value={data?.monthlyCost || ''}
                readOnly
                className="h-12 border-2 bg-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Annual Power Cost (₹)</label>
              <Input
                type="number"
                value={data?.annualCost || ''}
                readOnly
                className="h-12 border-2 bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 10: Other Expenses
export const OtherExpensesStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">Other Expenses</h3>
        <p className="text-sm text-muted-foreground">
          Estimate all other operational expenses and financial parameters.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Overhead Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Repair and Maintenance (₹)</label>
              <Input
                type="number"
                value={data?.repairMaintenance || ''}
                onChange={(e) => onChange({...data, repairMaintenance: e.target.value})}
                placeholder="Annual maintenance"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Power and Fuel (₹)</label>
              <Input
                type="number"
                value={data?.powerFuel || ''}
                onChange={(e) => onChange({...data, powerFuel: e.target.value})}
                placeholder="From power estimate"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Other Overhead Expenses (₹)</label>
              <Input
                type="number"
                value={data?.otherOverhead || ''}
                onChange={(e) => onChange({...data, otherOverhead: e.target.value})}
                placeholder="Insurance, security, etc."
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Telephone Expenses (₹)</label>
              <Input
                type="number"
                value={data?.telephone || ''}
                onChange={(e) => onChange({...data, telephone: e.target.value})}
                placeholder="Phone, internet"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Stationery & Postage (₹)</label>
              <Input
                type="number"
                value={data?.stationery || ''}
                onChange={(e) => onChange({...data, stationery: e.target.value})}
                placeholder="Office supplies"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Advertisement & Publicity (₹)</label>
              <Input
                type="number"
                value={data?.advertisement || ''}
                onChange={(e) => onChange({...data, advertisement: e.target.value})}
                placeholder="Marketing expenses"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Building Rent (₹)</label>
              <Input
                type="number"
                value={data?.buildingRent || ''}
                onChange={(e) => onChange({...data, buildingRent: e.target.value})}
                placeholder="If rented (otherwise 0)"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Other Miscellaneous (₹)</label>
              <Input
                type="number"
                value={data?.miscellaneous || ''}
                onChange={(e) => onChange({...data, miscellaneous: e.target.value})}
                placeholder="Any other expenses"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-secondary/20">
        <CardHeader>
          <CardTitle>Financial Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Rate of Interest (%)</label>
            <Input
              type="number"
              value={data?.interestRate || ''}
              onChange={(e) => onChange({...data, interestRate: e.target.value})}
              placeholder="Bank loan interest rate"
              className="h-12 border-2 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Depreciation Rate - Building (%)</label>
              <Input
                type="number"
                value={data?.depreciationBuilding || ''}
                onChange={(e) => onChange({...data, depreciationBuilding: e.target.value})}
                placeholder="Typically 5-10%"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Depreciation Rate - Machinery (%)</label>
              <Input
                type="number"
                value={data?.depreciationMachinery || ''}
                onChange={(e) => onChange({...data, depreciationMachinery: e.target.value})}
                placeholder="Typically 10-15%"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 11: About the Beneficiary
export const BeneficiaryStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border-l-4 border-l-primary p-4 rounded-r-lg">
        <h3 className="text-xl font-bold text-foreground mb-2">About the Beneficiary</h3>
        <p className="text-sm text-muted-foreground">
          Provide complete personal details of the beneficiary.
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Full Name *</label>
              <Input
                value={data?.fullName || ''}
                onChange={(e) => onChange({...data, fullName: e.target.value})}
                placeholder="Enter full name"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Father's/Spouse's Name *</label>
              <Input
                value={data?.fathersName || ''}
                onChange={(e) => onChange({...data, fathersName: e.target.value})}
                placeholder="Enter name"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Date of Birth</label>
              <Input
                type="date"
                value={data?.dateOfBirth || ''}
                onChange={(e) => onChange({...data, dateOfBirth: e.target.value})}
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Age</label>
              <Input
                type="number"
                value={data?.age || ''}
                onChange={(e) => onChange({...data, age: e.target.value})}
                placeholder="Enter age"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Educational Qualification</label>
              <Input
                value={data?.educationalQualification || ''}
                onChange={(e) => onChange({...data, educationalQualification: e.target.value})}
                placeholder="Enter qualification"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Experience (Years)</label>
              <Input
                type="number"
                value={data?.experience || ''}
                onChange={(e) => onChange({...data, experience: e.target.value})}
                placeholder="Years of experience"
                className="h-12 border-2 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-foreground">Previous Business Experience</label>
              <textarea
                value={data?.previousBusinessExperience || ''}
                onChange={(e) => onChange({...data, previousBusinessExperience: e.target.value})}
                placeholder="Describe any previous business experience"
                className="w-full p-3 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-secondary/20">
        <CardHeader>
          <CardTitle>Address Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Permanent Address</label>
            <textarea
              value={data?.permanentAddress || ''}
              onChange={(e) => onChange({...data, permanentAddress: e.target.value})}
              placeholder="Enter complete permanent address"
              className="w-full p-3 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Correspondence Address</label>
            <textarea
              value={data?.correspondenceAddress || ''}
              onChange={(e) => onChange({...data, correspondenceAddress: e.target.value})}
              placeholder="Enter correspondence address"
              className="w-full p-3 border-2 rounded-lg focus:border-primary focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

