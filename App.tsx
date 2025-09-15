
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HarvestAndLotManagement from './components/LotManagement';
import QualityControl from './components/QualityControl';
import Inventory from './components/Inventory';
import FructificationEvaluation from './components/FructificationEvaluation';
import SeedNeeds from './components/SeedNeeds';
import EvaluationProgram from './components/EvaluationProgram';
import Distribution from './components/Distribution';
import { Page, MockData } from './types';
import SpeciesManagement from './components/SpeciesManagement';
import ProvenanceManagement from './components/ProvenanceManagement';
import ProviderManagement from './components/ProviderManagement';
import SrsManagement from './components/SrsManagement';
import SeedTreatment from './components/SeedTreatment';
import RegionManagement from './components/RegionManagement';
import { generateMockData } from './services/geminiService';
import Spinner from './components/shared/Spinner';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [data, setData] = useState<MockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const mockData = await generateMockData();
            setData(mockData);
            setError(null);
        } catch (err) {
            setError('Failed to load application data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);


  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <Spinner />
                <p className="ml-4 text-slate-600">Chargement des données de l'application...</p>
            </div>
        );
    }

    if (error || !data) {
        return <div className="text-center text-red-500 font-semibold p-8">{error || 'Aucune donnée disponible.'}</div>;
    }


    switch (currentPage) {
      case 'dashboard':
        return <Dashboard data={data} setData={setData} />;
      case 'seed-needs':
        return <SeedNeeds />;
      case 'evaluation-program':
        return <EvaluationProgram />;
      case 'fructification-evaluation':
        return <FructificationEvaluation />;
      case 'harvest-and-lots':
        return <HarvestAndLotManagement data={data} setData={setData} />;
      case 'seed-treatment':
        return <SeedTreatment />;
      case 'quality-control':
        return <QualityControl data={data} setData={setData} />;
      case 'inventory':
        return <Inventory data={data} setData={setData} />;
      case 'distribution':
        return <Distribution />;
      case 'species-management':
        return <SpeciesManagement />;
      case 'provenance-management':
        return <ProvenanceManagement />;
      case 'region-management':
        return <RegionManagement />;
      case 'provider-management':
        return <ProviderManagement />;
      case 'srs-management':
        return <SrsManagement />;
      default:
        return <Dashboard data={data} setData={setData} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
