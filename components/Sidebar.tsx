
import React, { useState, useEffect } from 'react';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const SeedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM3 9a7 7 0 1112.33 4.93l-1.41 1.41A5 5 0 109 5.07V3a8.001 8.001 0 00-6 6z" clipRule="evenodd" />
        <path d="M10.5 10a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5z" />
        <path d="M10 10a.5.5 0 00-1 0v3a.5.5 0 001 0v-3z" />
    </svg>
);

const NavItem: React.FC<{
  icon: JSX.Element;
  label: string;
  page: Page;
  currentPage: Page;
  onClick: () => void;
}> = ({ icon, label, page, currentPage, onClick }) => {
  const isActive = currentPage === page;
  return (
    <li
      onClick={onClick}
      className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-emerald-600 text-white shadow-md'
          : 'text-slate-200 hover:bg-emerald-800 hover:text-white'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span className="font-medium">{label}</span>
    </li>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const [openSection, setOpenSection] = useState<string | null>('workflow');

  const dashboardItem: { icon: JSX.Element; label: string; page: Page } = {
      icon: <DashboardIcon />,
      label: 'Tableau de bord',
      page: 'dashboard',
  };

  const workflowItems: { icon: JSX.Element; label: string; page: Page }[] = [
    { icon: <NeedsIcon />, label: 'Besoins Semences', page: 'seed-needs' },
    { icon: <ProgramIcon />, label: 'Programme d\'Évaluation', page: 'evaluation-program' },
    { icon: <FructificationIcon />, label: 'Évaluation Fructification', page: 'fructification-evaluation' },
    { icon: <LotIcon />, label: 'Récoltes & Lots', page: 'harvest-and-lots' },
    { icon: <TreatmentIcon />, label: 'Traitement Semences', page: 'seed-treatment' },
    { icon: <QualityIcon />, label: 'Contrôle Qualité', page: 'quality-control' },
    { icon: <InventoryIcon />, label: 'Inventaire', page: 'inventory' },
    { icon: <DistributionIcon />, label: 'Distribution', page: 'distribution' }
  ];

  const managementItems: { icon: JSX.Element; label: string; page: Page }[] = [
    { icon: <SpeciesManagementIcon />, label: 'Espèces', page: 'species-management' },
    { icon: <RegionIcon />, label: 'Régions', page: 'region-management' },
    { icon: <ProvenanceIcon />, label: 'Provenances', page: 'provenance-management' },
    { icon: <ProviderIcon />, label: 'Prestataires', page: 'provider-management' },
    { icon: <SrsIcon />, label: 'SRS', page: 'srs-management' },
  ];

  useEffect(() => {
    const isWorkflowPage = workflowItems.some(item => item.page === currentPage);
    const isManagementPage = managementItems.some(item => item.page === currentPage);

    if (isWorkflowPage) {
      setOpenSection('workflow');
    } else if (isManagementPage) {
      setOpenSection('settings');
    }
  }, [currentPage]);

  const handleToggleSection = (section: string) => {
    setOpenSection(prevOpenSection => (prevOpenSection === section ? null : section));
  };
  
  const CollapsibleSection: React.FC<{
    title: string;
    sectionId: string;
    items: { icon: JSX.Element; label: string; page: Page }[];
  }> = ({ title, sectionId, items }) => {
    const isOpen = openSection === sectionId;
    return (
        <div className="mt-4">
            <button
              onClick={() => handleToggleSection(sectionId)}
              className="flex items-center justify-between w-full px-3 py-2 text-left text-sm font-semibold text-slate-300 hover:text-white transition-colors rounded-md"
            >
              <span className="uppercase tracking-wider">{title}</span>
              <ChevronIcon isOpen={isOpen} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
                <ul className="pt-1 pl-2 border-l border-emerald-800 ml-3">
                    {items.map((item) => (
                      <NavItem
                        key={item.page}
                        {...item}
                        currentPage={currentPage}
                        onClick={() => setCurrentPage(item.page)}
                      />
                    ))}
                </ul>
            </div>
        </div>
    );
  };

  return (
    <aside className="w-64 bg-emerald-900 text-white flex flex-col p-4 shadow-lg">
      <div className="flex items-center mb-6 p-2">
        <SeedIcon />
        <h1 className="text-2xl font-bold ml-2 text-green-50">Semences Pro</h1>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul>
          <NavItem
              key={dashboardItem.page}
              {...dashboardItem}
              currentPage={currentPage}
              onClick={() => setCurrentPage(dashboardItem.page)}
            />
        </ul>
        
        <CollapsibleSection title="Flux de Travail" sectionId="workflow" items={workflowItems} />
        <CollapsibleSection title="Paramètres" sectionId="settings" items={managementItems} />
        
      </nav>
      <div className="mt-auto p-2 text-center text-slate-400 text-sm">
        <p>&copy; 2024 Geo-Solutions</p>
        <p>Version 1.2.0</p>
      </div>
    </aside>
  );
};

// --- ICONS ---
const RegionIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
);
const TreatmentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12a5 5 0 015-5 5 5 0 015 5v0a5 5 0 01-5 5 5 5 0 01-5-5v0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);
const DashboardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
);
const FructificationIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
);
const LotIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
);
const QualityIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const InventoryIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s-4 2-4 4s4 4 4 4m16-8s4 2 4 4s-4 4-4 4"></path></svg>
);
const NeedsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const ProgramIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 ëñ24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
);
const DistributionIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16.5l-3.5-3.5-3.5 3.5M8 13v7.5M8 4.5v5M16 4.5l3.5 3.5 3.5-3.5M16 8v-3.5M16 20.5v-7.5"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.5 13H1v-2.5C1 8.364 2.864 6.5 5 6.5H19c2.136 0 4-1.864 4-4V1"></path></svg>
);
const SpeciesManagementIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 7.172a4 4 0 00-5.656 0M9.172 16.828a4 4 0 005.656 0M9 12a2 2 0 104 0 2 2 0 00-4 0z"></path></svg>
);
const ProvenanceIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
);
const ProviderIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
);
const SrsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
);

export default Sidebar;
