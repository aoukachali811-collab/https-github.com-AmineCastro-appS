
import React, { useState, useEffect, useMemo } from 'react';
import type { MockData, EvaluationProgram, Srs, Species } from '../types';
import { generateMockData } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

const EvaluationProgram: React.FC = () => {
    const [data, setData] = useState<MockData | null>(null);
    const [programs, setPrograms] = useState<EvaluationProgram[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<EvaluationProgram> | null>(null);
    const [selectedGenus, setSelectedGenus] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mockData = await generateMockData();
                setData(mockData);
                setPrograms(mockData.evaluationPrograms);
                setError(null);
            } catch (err) {
                setError('Failed to load evaluation programs. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { speciesMap, srsMap, genera, speciesByGenus } = useMemo(() => {
        if (!data) return { speciesMap: new Map(), srsMap: new Map(), genera: [], speciesByGenus: new Map() };
        const speciesMap = new Map(data.species.map(s => [s.id, s]));
        const srsMap = new Map(data.srs.map(s => [s.id, s]));
        const genera = [...new Set(data.species.map(s => s.genus))].sort();
        const speciesByGenus = new Map<string, Species[]>();
        data.species.forEach(s => {
            const list = speciesByGenus.get(s.genus) || [];
            list.push(s);
            speciesByGenus.set(s.genus, list);
        });
        return { speciesMap, srsMap, genera, speciesByGenus };
    }, [data]);

    const filteredPrograms = useMemo(() => {
        return programs.filter(program => {
            const species = speciesMap.get(program.speciesId);
            const srs = srsMap.get(program.srsId);
            const searchTermLower = searchTerm.toLowerCase();

            const matchesSearch = (
                program.id.toLowerCase().includes(searchTermLower) ||
                (species && species.commonName.toLowerCase().includes(searchTermLower)) ||
                (srs && srs.name.toLowerCase().includes(searchTermLower)) ||
                program.province.toLowerCase().includes(searchTermLower) ||
                program.status.toLowerCase().includes(searchTermLower)
            );

            const target = new Date(program.programmedDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || target >= start) && (!end || target <= end);

            return matchesSearch && matchesDate;
        });
    }, [programs, searchTerm, startDate, endDate, speciesMap, srsMap]);

    const handleOpenModal = (program: EvaluationProgram | null = null) => {
        if(program) {
            const species = speciesMap.get(program.speciesId);
            setSelectedGenus(species?.genus || '');
            setCurrentItem({ ...program });
        } else {
            setSelectedGenus('');
            setCurrentItem({ status: 'Planifié' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
        setSelectedGenus('');
    };

    const handleSave = () => {
        if (!currentItem) return;

        if (currentItem.id) {
            // Edit
            setPrograms(programs.map(p => p.id === currentItem.id ? currentItem as EvaluationProgram : p));
        } else {
            // Add
            const newProgram: EvaluationProgram = {
                ...currentItem,
                id: `PE-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                programmedDate: currentItem.programmedDate || new Date().toISOString().split('T')[0],
            } as EvaluationProgram;
            setPrograms([newProgram, ...programs]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
            setPrograms(programs.filter(p => p.id !== id));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const handleGenusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGenus(e.target.value);
        setCurrentItem(prev => prev ? { ...prev, speciesId: '' } : null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /><p className="ml-4 text-slate-600">Loading Programs...</p></div>;
    }
    if (error) {
        return <div className="text-center text-red-500 font-semibold">{error}</div>;
    }
    if (!data) {
        return <div className="text-center text-slate-500">No program data available.</div>;
    }

    const columns: Column<EvaluationProgram>[] = [
        { Header: 'ID Programme', accessor: 'id' },
        { Header: 'Espèce', accessor: (row) => speciesMap.get(row.speciesId)?.commonName || 'N/A' },
        { Header: 'SRS', accessor: (row) => srsMap.get(row.srsId)?.name || 'N/A' },
        { Header: 'Date Programmée', accessor: 'programmedDate' },
        { Header: 'Date Réelle', accessor: 'realDate', Cell: ({ value }) => value || 'N/A' },
        { 
            Header: 'Statut', 
            accessor: 'status',
            Cell: ({ row, value }) => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const isLate = !row.realDate && new Date(row.programmedDate) < today && row.status !== 'Terminé';
                const statusColor = {
                    'Planifié': isLate ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800',
                    'En Cours': 'bg-yellow-100 text-yellow-800',
                    'Terminé': 'bg-green-100 text-green-800',
                }[value] || 'bg-slate-100 text-slate-800';
                return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{isLate ? 'En Retard' : value}</span>;
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
            <h1 className="text-3xl font-bold text-slate-800">Programme d'Évaluation</h1>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="search" className="sr-only">Rechercher</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Rechercher par ID, espèce, SRS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">De (Date Prog.)</label>
                             <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">À (Date Prog.)</label>
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
                        Ajouter un Programme
                    </button>
                </div>
                <Table columns={columns} data={filteredPrograms} />
            </Card>

             {isModalOpen && currentItem && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Modifier le Programme' : 'Nouveau Programme'}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Genre</label>
                            <select value={selectedGenus} onChange={handleGenusChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un genre</option>
                                {genera.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="speciesId" className="block text-sm font-medium text-slate-700">Espèce</label>
                            <select name="speciesId" value={currentItem.speciesId || ''} onChange={handleInputChange} disabled={!selectedGenus} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-50">
                                <option value="">Sélectionner une espèce</option>
                                {selectedGenus && speciesByGenus.get(selectedGenus)?.map(s => <option key={s.id} value={s.id}>{s.commonName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="srsId" className="block text-sm font-medium text-slate-700">SRS</label>
                            <select name="srsId" value={currentItem.srsId || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un SRS</option>
                                {data.srs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="province" className="block text-sm font-medium text-slate-700">Province</label>
                            <input type="text" name="province" value={currentItem.province || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="programmedDate" className="block text-sm font-medium text-slate-700">Date Programmée</label>
                                <input type="date" name="programmedDate" value={currentItem.programmedDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="realDate" className="block text-sm font-medium text-slate-700">Date Réelle</label>
                                <input type="date" name="realDate" value={currentItem.realDate || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700">Statut</label>
                            <select name="status" value={currentItem.status} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                               <option>Planifié</option>
                               <option>En Cours</option>
                               <option>Terminé</option>
                            </select>
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

export default EvaluationProgram;