
import React, { useState, useMemo } from 'react';
import type { MockData, QualityCheck, Lot, Species } from '../types';
import Card from './shared/Card';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface QualityControlProps {
    data: MockData;
    setData: (data: MockData) => void;
}

const QualityControl: React.FC<QualityControlProps> = ({ data, setData }) => {
    const { qualityChecks, lots, species } = data;
    
    const [filterLotId, setFilterLotId] = useState('');
    const [filterCheckType, setFilterCheckType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCheck, setCurrentCheck] = useState<Partial<QualityCheck> | null>(null);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLotData, setHistoryLotData] = useState<{lotId: string; checks: QualityCheck[] } | null>(null);
    
    const { speciesMap, lotMap } = useMemo(() => {
        const speciesMap = new Map(species.map(s => [s.id, s]));
        const lotMap = new Map(lots.map(l => [l.id, l]));
        return { speciesMap, lotMap };
    }, [species, lots]);

    const filteredChecks = useMemo(() => {
        return qualityChecks.filter(check => {
            const matchesLot = !filterLotId || check.lotId === filterLotId;
            const matchesType = !filterCheckType || check.checkType === filterCheckType;
            
            const checkDate = new Date(check.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || checkDate >= start) && (!end || checkDate <= end);

            return matchesLot && matchesType && matchesDate;
        });
    }, [qualityChecks, filterLotId, filterCheckType, startDate, endDate]);

    const handleOpenModal = (check: QualityCheck | null = null) => {
        setCurrentCheck(check ? { ...check } : { result: 'Pass', checkType: 'Avant Conditionnement' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCheck(null);
    };
    
    const handleViewHistory = (lotId: string) => {
        const checksForLot = qualityChecks
            .filter(qc => qc.lotId === lotId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setHistoryLotData({
            lotId: lotId,
            checks: checksForLot
        });
        setIsHistoryModalOpen(true);
    };

    const handleSave = () => {
        if (!currentCheck || !currentCheck.lotId) return;

        let newChecks: QualityCheck[];
        let checkToProcess: QualityCheck;
        let newLots = [...lots];

        if (currentCheck.id) {
            checkToProcess = currentCheck as QualityCheck;
            newChecks = qualityChecks.map(qc => qc.id === currentCheck.id ? checkToProcess : qc);
        } else {
            checkToProcess = {
                ...currentCheck,
                id: `QC-${Date.now()}`,
                date: currentCheck.date || new Date().toISOString().split('T')[0],
            } as QualityCheck;
            newChecks = [checkToProcess, ...qualityChecks];
        }

        // Automatically update lot status if QC fails.
        if (checkToProcess.result === 'Fail') {
            const lotIndex = newLots.findIndex(l => l.id === checkToProcess.lotId);
            if (lotIndex !== -1 && newLots[lotIndex].status !== 'En traitement') {
                newLots[lotIndex] = { ...newLots[lotIndex], status: 'En traitement' };
            }
        }
        
        setData({ ...data, qualityChecks: newChecks, lots: newLots });
        handleCloseModal();
    };


    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrôle ?')) {
            const newChecks = qualityChecks.filter(qc => qc.id !== id)
            setData({ ...data, qualityChecks: newChecks });
        }
    };

    const getSpeciesNameForLot = (lotId: string) : string => {
        const lot = lotMap.get(lotId);
        const species = lot ? speciesMap.get(lot.speciesId) : null;
        return species ? species.commonName : 'Inconnue';
    }


    const columns: Column<QualityCheck>[] = [
        { Header: 'ID Lot', accessor: 'lotId' },
        { Header: 'Espèce', accessor: (row) => getSpeciesNameForLot(row.lotId) },
        { Header: 'Type de Contrôle', accessor: 'checkType' },
        { Header: 'Date', accessor: 'date' },
        { Header: 'Taux Germination (%)', accessor: 'germinationRate' },
        { Header: 'Résultat', accessor: 'result', 
            Cell: ({ value }: { value: 'Pass' | 'Fail' }) => {
                const resultColor = value === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                return <span className={`px-2 py-1 text-xs font-medium rounded-full ${resultColor}`}>{value === 'Pass' ? 'Conforme' : 'Non Conforme'}</span>;
            }
        },
        {
            Header: 'Actions',
            accessor: 'id',
            Cell: ({ row }) => (
                <div className="flex space-x-2">
                    <button onClick={() => handleViewHistory(row.lotId)} className="text-gray-500 hover:text-gray-800" title="Historique du lot">
                        <HistoryIcon />
                    </button>
                    <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-900" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )
        }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentCheck(prev => prev ? { ...prev, [name]: value } : null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Contrôle Qualité</h1>
            <Card>
                 <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4 items-end">
                    <div>
                        <label htmlFor="lotFilter" className="block text-sm font-medium text-slate-700">Filtrer par Lot</label>
                        <select id="lotFilter" value={filterLotId} onChange={e => setFilterLotId(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                           <option value="">Tous les lots</option>
                           {[...new Set(qualityChecks.map(qc => qc.lotId))].sort().map(lotId => <option key={lotId} value={lotId}>{lotId}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="typeFilter" className="block text-sm font-medium text-slate-700">Type de Contrôle</label>
                        <select id="typeFilter" value={filterCheckType} onChange={e => setFilterCheckType(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                           <option value="">Tous les types</option>
                           <option>Avant Conditionnement</option>
                           <option>Après Conditionnement</option>
                           <option>Périodique</option>
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">De</label>
                             <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">À</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                        Nouveau Contrôle
                    </button>
                </div>
                <Table columns={columns} data={filteredChecks} />
            </Card>

            {isModalOpen && currentCheck && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentCheck.id ? 'Modifier le Contrôle' : 'Nouveau Contrôle'}>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="lotId" className="block text-sm font-medium text-slate-700">Lot</label>
                            <select name="lotId" value={currentCheck.lotId} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un lot</option>
                                {data.lots.map(l => <option key={l.id} value={l.id}>{l.id}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="checkType" className="block text-sm font-medium text-slate-700">Type de contrôle</label>
                            <select name="checkType" value={currentCheck.checkType} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option>Avant Conditionnement</option>
                                <option>Après Conditionnement</option>
                                <option>Périodique</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
                            <input type="date" name="date" value={currentCheck.date} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="germinationRate" className="block text-sm font-medium text-slate-700">Taux Germination (%)</label>
                            <input type="number" name="germinationRate" value={currentCheck.germinationRate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="purity" className="block text-sm font-medium text-slate-700">Pureté (%)</label>
                            <input type="number" name="purity" value={currentCheck.purity} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="moistureContent" className="block text-sm font-medium text-slate-700">Teneur en Eau (%)</label>
                            <input type="number" name="moistureContent" value={currentCheck.moistureContent} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="thousandSeedWeight" className="block text-sm font-medium text-slate-700">Poids/1000 Grains (g)</label>
                            <input type="number" name="thousandSeedWeight" value={currentCheck.thousandSeedWeight} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="result" className="block text-sm font-medium text-slate-700">Résultat</label>
                             <select name="result" value={currentCheck.result} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                               <option value="Pass">Conforme</option>
                               <option value="Fail">Non Conforme</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Annuler</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Sauvegarder</button>
                        </div>
                    </div>
                </Modal>
            )}

            {isHistoryModalOpen && historyLotData && (
                 <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Fiche d'Identité du Lot: ${historyLotData.lotId}`}>
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-slate-800">Informations du Lot</h3>
                            <p className="text-slate-600"><strong>Espèce:</strong> {getSpeciesNameForLot(historyLotData.lotId)}</p>
                        </div>
                        
                        <div>
                             <h3 className="text-lg font-semibold text-slate-800 mb-2">Évolution des Indicateurs Qualité</h3>
                             <div className="w-full h-80 pr-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyLotData.checks} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis label={{ value: 'Taux (%)', angle: -90, position: 'insideLeft' }} domain={[60, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="germinationRate" name="Taux Germination" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                                        <Line type="monotone" dataKey="purity" name="Pureté" stroke="#3b82f6" strokeWidth={2} />
                                        <Line type="monotone" dataKey="moistureContent" name="Teneur en Eau" stroke="#f59e0b" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Historique des Contrôles</h3>
                             <div className="max-h-64 overflow-y-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Germ. (%)</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pureté (%)</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Humid. (%)</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Résultat</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {historyLotData.checks.map(check => (
                                            <tr key={check.id}>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{check.date}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{check.checkType}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{check.germinationRate}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{check.purity}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-600">{check.moistureContent}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${check.result === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{check.result === 'Pass' ? 'Conforme' : 'Non Conforme'}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                 </Modal>
            )}
        </div>
    );
};

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);


export default QualityControl;
