
import React, { useState, useEffect, useMemo } from 'react';
import type { MockData, Provenance, Region, Species } from '../types';
import { generateMockData } from '../services/geminiService';
import Card from './shared/Card';
import Spinner from './shared/Spinner';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

const ProvenanceManagement: React.FC = () => {
    const [data, setData] = useState<MockData | null>(null);
    const [provenances, setProvenances] = useState<Provenance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<Provenance> | null>(null);
    const [selectedGenus, setSelectedGenus] = useState<string>('');


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const mockData = await generateMockData();
                setData(mockData);
                setProvenances(mockData.provenances);
                setError(null);
            } catch (err) {
                setError('Failed to load provenance data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { regionMap, speciesMap, genera, speciesByGenus } = useMemo(() => {
        if (!data) return { regionMap: new Map(), speciesMap: new Map(), genera: [], speciesByGenus: new Map() };
        const regionMap = new Map(data.regions.map(r => [r.id, r]));
        const speciesMap = new Map(data.species.map(s => [s.id, s]));
        const genera = [...new Set(data.species.map(s => s.genus))].sort();
        const speciesByGenus = new Map<string, Species[]>();
        data.species.forEach(s => {
            const list = speciesByGenus.get(s.genus) || [];
            list.push(s);
            speciesByGenus.set(s.genus, list);
        });
        return { regionMap, speciesMap, genera, speciesByGenus };
    }, [data]);

    const filteredProvenances = useMemo(() => {
        return provenances.filter(item => {
            const region = regionMap.get(item.regionId);
            const species = speciesMap.get(item.speciesId);
            const searchTermLower = searchTerm.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchTermLower) ||
                item.code.toLowerCase().includes(searchTermLower) ||
                item.localisation.toLowerCase().includes(searchTermLower) ||
                (region && region.name.toLowerCase().includes(searchTermLower)) ||
                (species && species.commonName.toLowerCase().includes(searchTermLower))
            );
        });
    }, [provenances, searchTerm, regionMap, speciesMap]);
    
    // Auto-génération du code de provenance
    useEffect(() => {
        const getSpeciesAbbreviation = (scientificName: string): string => {
            if (!scientificName) return 'XX';
            const words = scientificName.split(' ');
            if (words.length > 1) {
                return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
            }
            return scientificName.substring(0, 2).toUpperCase();
        };
        const sanitizeForCode = (name: string): string => {
            return name.replace(/[^a-zA-Z0-9]/g, '');
        };

        if (currentItem && currentItem.regionId && currentItem.speciesId && currentItem.name && data) {
            const region = regionMap.get(currentItem.regionId);
            const species = speciesMap.get(currentItem.speciesId);
            if (region && species) {
                const regionCode = region.code;
                const speciesAbbr = getSpeciesAbbreviation(species.scientificName);
                const sanitizedName = sanitizeForCode(currentItem.name);
                const newCode = `${regionCode}-${speciesAbbr}-${sanitizedName}`;
                if (newCode !== currentItem.code) {
                     setCurrentItem(prev => prev ? { ...prev, code: newCode } : null);
                }
            }
        }
    }, [currentItem?.regionId, currentItem?.speciesId, currentItem?.name, data, regionMap, speciesMap]);


    const handleOpenModal = (item: Provenance | null = null) => {
        if (item) {
            const species = speciesMap.get(item.speciesId);
            setSelectedGenus(species?.genus || '');
            setCurrentItem({ ...item });
        } else {
            setSelectedGenus('');
            setCurrentItem({});
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
        setSelectedGenus('');
    };

    const handleSave = () => {
        if (!currentItem || !currentItem.code || !currentItem.name || !currentItem.speciesId || !currentItem.regionId) {
            alert("Veuillez remplir tous les champs requis.");
            return;
        }
        if (currentItem.id) {
            setProvenances(provenances.map(p => p.id === currentItem.id ? currentItem as Provenance : p));
        } else {
            const newProvenance: Provenance = {
                id: `prov-${Date.now()}`,
                ...currentItem
            } as Provenance;
            setProvenances([newProvenance, ...provenances]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette provenance ?')) {
            setProvenances(provenances.filter(p => p.id !== id));
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleGenusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGenus(e.target.value);
        setCurrentItem(prev => prev ? { ...prev, speciesId: '', code: '' } : null);
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

    const columns: Column<Provenance>[] = [
        { Header: 'Code', accessor: 'code' },
        { Header: 'Libellé de la provenance', accessor: 'name' },
        { Header: 'Espèce', accessor: (row) => speciesMap.get(row.speciesId)?.commonName || 'N/A' },
        { Header: 'Localisation', accessor: 'localisation' },
        { Header: 'Région', accessor: (row) => regionMap.get(row.regionId)?.name || 'N/A' },
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
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Provenances</h1>
            <Card>
                <div className="flex justify-between items-center mb-4">
                     <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button 
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                        Ajouter une Provenance
                    </button>
                </div>
                <Table columns={columns} data={filteredProvenances} />
            </Card>

            {isModalOpen && currentItem && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Modifier la Provenance' : 'Nouvelle Provenance'}>
                     <div className="space-y-4">
                         <div>
                            <label htmlFor="regionId" className="block text-sm font-medium text-slate-700">Région de provenance</label>
                            <select name="regionId" value={currentItem.regionId || ''} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner une région</option>
                                {data.regions.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                            </select>
                        </div>
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
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Libellé de la provenance</label>
                            <input type="text" name="name" value={currentItem.name || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-slate-700">Code Provenance</label>
                            <input type="text" name="code" value={currentItem.code || ''} readOnly className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-100"/>
                        </div>
                         <div>
                            <label htmlFor="localisation" className="block text-sm font-medium text-slate-700">Localisation</label>
                            <input type="text" name="localisation" value={currentItem.localisation || ''} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
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

export default ProvenanceManagement;