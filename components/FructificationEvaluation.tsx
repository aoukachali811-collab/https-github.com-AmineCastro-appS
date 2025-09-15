
import React, { useState, useEffect, useMemo } from 'react';
import type { MockData, FructificationEvaluation, Srs } from '../types';
import { generateMockData } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

const FructificationEvaluationPage: React.FC = () => {
    const [data, setData] = useState<MockData | null>(null);
    const [evaluations, setEvaluations] = useState<FructificationEvaluation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEvaluation, setCurrentEvaluation] = useState<Partial<FructificationEvaluation> | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mockData = await generateMockData();
                setData(mockData);
                setEvaluations(mockData.fructificationEvaluations);
                setError(null);
            } catch (err) {
                setError('Failed to load evaluation data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const srsMap = useMemo(() => {
        if (!data) return new Map<string, Srs>();
        return new Map(data.srs.map(s => [s.id, s]));
    }, [data]);

    const filteredEvaluations = useMemo(() => {
        return evaluations.filter(evaluation => {
            const srs = srsMap.get(evaluation.srsId);
            const searchTermLower = searchTerm.toLowerCase();

            const matchesSearch = (
                evaluation.programId.toLowerCase().includes(searchTermLower) ||
                srs?.name.toLowerCase().includes(searchTermLower) ||
                evaluation.reportSummary.toLowerCase().includes(searchTermLower)
            );

            const evalDate = new Date(evaluation.evaluationDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || evalDate >= start) && (!end || evalDate <= end);

            return matchesSearch && matchesDate;
        });
    }, [evaluations, searchTerm, startDate, endDate, srsMap]);
    
    const handleOpenModal = (evaluation: FructificationEvaluation | null = null) => {
        setCurrentEvaluation(evaluation ? { ...evaluation } : {});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentEvaluation(null);
    };

    const handleSave = () => {
        if (!currentEvaluation) return;

        if (currentEvaluation.id) {
            // Edit
            setEvaluations(evaluations.map(e => e.id === currentEvaluation.id ? currentEvaluation as FructificationEvaluation : e));
        } else {
            // Add
            const newEvaluation: FructificationEvaluation = {
                ...currentEvaluation,
                id: `FE-${Date.now()}`,
                evaluationDate: currentEvaluation.evaluationDate || new Date().toISOString().split('T')[0],
            } as FructificationEvaluation;
            setEvaluations([newEvaluation, ...evaluations]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette évaluation ?')) {
            setEvaluations(evaluations.filter(e => e.id !== id));
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /><p className="ml-4 text-slate-600">Loading Evaluation Data...</p></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 font-semibold">{error}</div>;
    }

    if (!data) {
        return <div className="text-center text-slate-500">No evaluation data available.</div>;
    }

    const columns: Column<FructificationEvaluation>[] = [
        { Header: 'ID Programme', accessor: 'programId' },
        { Header: 'SRS', accessor: (row: FructificationEvaluation) => srsMap.get(row.srsId)?.name || 'N/A' },
        { Header: 'Date', accessor: 'evaluationDate' },
        { Header: 'Résumé', accessor: 'reportSummary' },
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentEvaluation(prev => prev ? { ...prev, [name]: value } : null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Évaluation de la Fructification</h1>
            <Card>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2">
                         <label htmlFor="search" className="sr-only">Rechercher</label>
                         <input
                            id="search"
                            type="text"
                            placeholder="Rechercher par Programme, SRS..."
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
                        Nouvelle Évaluation
                    </button>
                </div>
                <Table columns={columns} data={filteredEvaluations} />
            </Card>

            {isModalOpen && currentEvaluation && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentEvaluation.id ? 'Modifier l\'Évaluation' : 'Nouvelle Évaluation'}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="programId" className="block text-sm font-medium text-slate-700">ID Programme</label>
                            <input type="text" name="programId" value={currentEvaluation.programId || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="srsId" className="block text-sm font-medium text-slate-700">SRS</label>
                            <select name="srsId" value={currentEvaluation.srsId || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un SRS</option>
                                {data.srs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="evaluationDate" className="block text-sm font-medium text-slate-700">Date d'évaluation</label>
                            <input type="date" name="evaluationDate" value={currentEvaluation.evaluationDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="reportSummary" className="block text-sm font-medium text-slate-700">Résumé</label>
                            <textarea name="reportSummary" value={currentEvaluation.reportSummary || ''} onChange={handleInputChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"></textarea>
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

export default FructificationEvaluationPage;