
import React, { useState, useEffect, useMemo } from 'react';
import type { MockData, Region } from '../types';
import { generateMockData } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

const RegionManagement: React.FC = () => {
    const [data, setData] = useState<MockData | null>(null);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<Region> | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mockData = await generateMockData();
                setData(mockData);
                setRegions(mockData.regions);
                setError(null);
            } catch (err) {
                setError('Failed to load region data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredRegions = useMemo(() => {
        return regions.filter(item => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchTermLower) ||
                item.code.toLowerCase().includes(searchTermLower)
            );
        });
    }, [regions, searchTerm]);

    const handleOpenModal = (item: Region | null = null) => {
        setCurrentItem(item ? { ...item } : {});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleSave = () => {
        if (!currentItem) return;
        if (currentItem.id) {
            setRegions(regions.map(r => r.id === currentItem.id ? currentItem as Region : r));
        } else {
            const newRegion: Region = {
                id: `reg-${Date.now()}`,
                ...currentItem
            } as Region;
            setRegions([newRegion, ...regions]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
            setRegions(regions.filter(r => r.id !== id));
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /><p className="ml-4 text-slate-600">Loading Data...</p></div>;
    }
    if (error) {
        return <div className="text-center text-red-500 font-semibold">{error}</div>;
    }
    if (!data) {
        return <div className="text-center text-slate-500">No data available.</div>;
    }

    const columns: Column<Region>[] = [
        { Header: 'Code', accessor: 'code' },
        { Header: 'Libellé de la région', accessor: 'name' },
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
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Régions de Provenance</h1>
            <Card>
                <div className="flex justify-between items-center mb-4">
                     <input
                        type="text"
                        placeholder="Rechercher par code ou nom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                        Ajouter une Région
                    </button>
                </div>
                <Table columns={columns} data={filteredRegions} />
            </Card>

            {isModalOpen && currentItem && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Modifier la Région' : 'Nouvelle Région'}>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-slate-700">Code</label>
                            <input type="text" name="code" value={currentItem.code || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Libellé de la région</label>
                            <input type="text" name="name" value={currentItem.name || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
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

export default RegionManagement;
