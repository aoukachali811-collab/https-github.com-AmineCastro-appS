import React, { useState, useEffect, useMemo } from 'react';
import type { MockData, SeedTreatment, Lot } from '../types';
import { generateMockData } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

const SeedTreatment: React.FC = () => {
    const [data, setData] = useState<MockData | null>(null);
    const [treatments, setTreatments] = useState<SeedTreatment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<SeedTreatment> | null>(null);


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mockData = await generateMockData();
                setData(mockData);
                setTreatments(mockData.seedTreatments);
                setError(null);
            } catch (err) {
                setError('Failed to load seed treatment data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const lotMap = useMemo(() => {
        if (!data) return new Map<string, Lot>();
        return new Map(data.lots.map(lot => [lot.id, lot]));
    }, [data]);

    const ongoingTreatments = useMemo(() => {
        return treatments
            .filter(t => t.status === 'En cours' && t.startDate && t.endDate)
            .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }, [treatments]);

    const filteredTreatments = useMemo(() => {
        return treatments.filter(treatment => {
            const searchTermLower = searchTerm.toLowerCase();
            const lot = lotMap.get(treatment.lotId);

            const matchesSearch = (
                treatment.lotId.toLowerCase().includes(searchTermLower) ||
                treatment.treatmentType.toLowerCase().includes(searchTermLower) ||
                treatment.operator.toLowerCase().includes(searchTermLower) ||
                treatment.status.toLowerCase().includes(searchTermLower)
            );

            const treatmentStart = new Date(treatment.startDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
             if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || treatmentStart >= start) && (!end || treatmentStart <= end);
            
            return matchesSearch && matchesDate;
        });
    }, [treatments, searchTerm, startDate, endDate, lotMap]);

    const handleOpenModal = (treatment: SeedTreatment | null = null) => {
        setCurrentItem(treatment ? { ...treatment } : { status: 'Planifié', treatmentType: 'Trempage' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleSave = () => {
        if (!currentItem) return;
        if (currentItem.id) {
            // Edit
            setTreatments(treatments.map(t => t.id === currentItem.id ? currentItem as SeedTreatment : t));
        } else {
            // Add
            const newTreatment: SeedTreatment = {
                ...currentItem,
                id: `TRT-${Date.now()}`,
                startDate: currentItem.startDate || new Date().toISOString().split('T')[0],
            } as SeedTreatment;
            setTreatments([newTreatment, ...treatments]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce traitement ?')) {
            setTreatments(treatments.filter(t => t.id !== id));
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /><p className="ml-4 text-slate-600">Loading Treatment Data...</p></div>;
    }
    if (error) {
        return <div className="text-center text-red-500 font-semibold">{error}</div>;
    }
    if (!data) {
        return <div className="text-center text-slate-500">No data available.</div>;
    }

    const columns: Column<SeedTreatment>[] = [
        { Header: 'ID Lot', accessor: 'lotId' },
        { Header: 'Type Traitement', accessor: 'treatmentType' },
        { Header: 'Date Début', accessor: 'startDate' },
        { Header: 'Date Fin', accessor: 'endDate' },
        { Header: 'Opérateur', accessor: 'operator' },
        { 
            Header: 'Statut', 
            accessor: 'status',
            Cell: ({ value }) => {
                const statusColor = {
                    'Planifié': 'bg-blue-100 text-blue-800',
                    'En cours': 'bg-yellow-100 text-yellow-800',
                    'Terminé': 'bg-green-100 text-green-800',
                }[value] || 'bg-slate-100 text-slate-800';
                return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{value}</span>;
            }
        },
        {
            Header: 'Actions',
            accessor: 'id',
            Cell: ({ row }) => (
                <div className="flex space-x-2">
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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Traitement des Semences</h1>

            {ongoingTreatments.length > 0 && (
                <Card>
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Traitements en Cours</h2>
                    <div className="space-y-4">
                        {ongoingTreatments.map(treatment => {
                            const startDateObj = new Date(treatment.startDate);
                            const endDateObj = new Date(treatment.endDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const totalDuration = Math.max(1, (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24));
                            const elapsedDuration = Math.max(0, (today.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24));
                            
                            const progress = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));
                            
                            const daysRemaining = Math.max(0, Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)));

                            return (
                                <div key={treatment.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <span className="font-bold text-slate-800">{treatment.lotId}</span>
                                            <span className="ml-2 text-sm text-slate-500">({treatment.treatmentType})</span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600">{progress}%</span>
                                    </div>
                                    <div className="relative pt-1">
                                        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-slate-200">
                                            <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500 transition-all duration-500"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>Début: {new Date(treatment.startDate).toLocaleDateString()}</span>
                                        <span className="font-semibold text-amber-700">
                                            {daysRemaining > 0 ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}` : "Achèvement aujourd'hui"}
                                        </span>
                                        <span>Fin: {new Date(treatment.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            <Card>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2">
                         <label htmlFor="search" className="sr-only">Rechercher</label>
                         <input
                            id="search"
                            type="text"
                            placeholder="Rechercher par Lot, Type, Opérateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
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
                        Nouveau Traitement
                    </button>
                </div>
                <Table columns={columns} data={filteredTreatments} />
            </Card>
            
            {isModalOpen && currentItem && (
                 <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Modifier le Traitement' : 'Nouveau Traitement'}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="lotId" className="block text-sm font-medium text-slate-700">Lot</label>
                            <select name="lotId" value={currentItem.lotId || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un lot</option>
                                {data.lots.map(lot => <option key={lot.id} value={lot.id}>{lot.id}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="treatmentType" className="block text-sm font-medium text-slate-700">Type de traitement</label>
                            <select name="treatmentType" value={currentItem.treatmentType || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option>Trempage</option>
                                <option>Stratification à froid</option>
                                <option>Scarification mécanique</option>
                                <option>Traitement fongicide</option>
                            </select>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Date Début</label>
                                <input type="date" name="startDate" value={currentItem.startDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                            </div>
                             <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">Date Fin</label>
                                <input type="date" name="endDate" value={currentItem.endDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="operator" className="block text-sm font-medium text-slate-700">Opérateur</label>
                            <input type="text" name="operator" value={currentItem.operator || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700">Statut</label>
                            <select name="status" value={currentItem.status} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                               <option>Planifié</option>
                               <option>En cours</option>
                               <option>Terminé</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="observations" className="block text-sm font-medium text-slate-700">Observations</label>
                            <textarea name="observations" value={currentItem.observations || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"></textarea>
                        </div>
                         <div className="flex justify-end space-x-3 pt-4">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Annuler</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">Sauvegarder</button>
                        </div>
                    </div>
                 </Modal>
            )}
        </div>
    );
};

export default SeedTreatment;