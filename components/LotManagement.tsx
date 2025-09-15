
import React, { useState, useEffect, useMemo } from 'react';
import type { Lot, MockData, Species, Provenance, Srs, Prestataire, Region, StockItem } from '../types';
import Card from './shared/Card';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

interface LotManagementProps {
    data: MockData;
    setData: (data: MockData) => void;
}

const HarvestAndLotManagement: React.FC<LotManagementProps> = ({ data, setData }) => {
    const { lots, species, provenances, srs, prestataires, regions, stockItems } = data;

    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLot, setCurrentLot] = useState<Partial<Lot> | null>(null);
    const [selectedGenus, setSelectedGenus] = useState<string>('');
    
    const { speciesMap, provenanceMap, srsMap, prestataireMap, genera, speciesByGenus, regionMap } = useMemo(() => {
        const speciesMap = new Map(species.map(s => [s.id, s]));
        const provenanceMap = new Map(provenances.map(p => [p.id, p]));
        const srsMap = new Map(srs.map(s => [s.id, s]));
        const prestataireMap = new Map(prestataires.map(p => [p.id, p]));
        const regionMap = new Map(regions.map(r => [r.id, r]));
        const genera = [...new Set(species.map(s => s.genus))].sort();
        const speciesByGenus = new Map<string, Species[]>();
        species.forEach(s => {
            const list = speciesByGenus.get(s.genus) || [];
            list.push(s);
            speciesByGenus.set(s.genus, list);
        });
        return { speciesMap, provenanceMap, srsMap, prestataireMap, genera, speciesByGenus, regionMap };
    }, [species, provenances, srs, prestataires, regions]);


    const filteredLots = useMemo(() => {
        return lots.filter(lot => {
            const species = speciesMap.get(lot.speciesId);
            const srs = srsMap.get(lot.srsId);
            const prestataire = lot.prestataireId ? prestataireMap.get(lot.prestataireId) : null;
            const searchTermLower = searchTerm.toLowerCase();
            
            const matchesSearchTerm = (
                lot.id.toLowerCase().includes(searchTermLower) ||
                (species && species.commonName.toLowerCase().includes(searchTermLower)) ||
                (srs && srs.name.toLowerCase().includes(searchTermLower)) ||
                (prestataire && prestataire.name.toLowerCase().includes(searchTermLower)) ||
                lot.seedStand.toLowerCase().includes(searchTermLower)
            );
            
            const harvest = new Date(lot.harvestDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || harvest >= start) && (!end || harvest <= end);
            
            const matchesStatus = !filterStatus || lot.status === filterStatus;
            const matchesCategory = !filterCategory || lot.category === filterCategory;

            return matchesSearchTerm && matchesDate && matchesStatus && matchesCategory;
        });
    }, [lots, searchTerm, startDate, endDate, filterStatus, filterCategory, speciesMap, srsMap, prestataireMap]);

    const handleOpenModal = (lot: Lot | null = null) => {
        if (lot) {
            const species = speciesMap.get(lot.speciesId);
            setSelectedGenus(species?.genus || '');
            setCurrentLot({ ...lot });
        } else {
            setSelectedGenus('');
            setCurrentLot({ status: 'En traitement', category: 'Récolte', harvestYear: new Date().getFullYear(), seedStand: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentLot(null);
        setSelectedGenus('');
    };

    const handleSave = () => {
        if (!currentLot) return;

        let newLots: Lot[];
        let newStockItems = [...stockItems];

        if (currentLot.id) {
             const originalLot = lots.find(l => l.id === currentLot.id);
            newLots = lots.map(l => l.id === currentLot!.id ? currentLot as Lot : l);
            
            // If status changes to 'Distribué', remove from inventory.
            if (currentLot.status === 'Distribué' && originalLot?.status !== 'Distribué') {
                newStockItems = stockItems.filter(item => item.lotId !== currentLot.id);
            }
        } else {
            const getSpeciesAbbreviation = (scientificName: string): string => {
                if (!scientificName) return 'XX';
                const words = scientificName.split(' ');
                if (words.length > 1) {
                    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
                }
                return scientificName.substring(0, 2).toUpperCase();
            };

            const generateNewLotId = (): string => {
                if (!currentLot.harvestYear || !currentLot.speciesId || !currentLot.provenanceId) {
                    alert('Veuillez renseigner l\'année de récolte, l\'espèce et la provenance pour générer un ID.');
                    return '';
                }
    
                const year = String(currentLot.harvestYear).slice(-2);
    
                const species = speciesMap.get(currentLot.speciesId);
                if (!species) {
                    alert('Espèce non trouvée.');
                    return '';
                }
                const speciesAbbr = getSpeciesAbbreviation(species.scientificName);
    
                const provenance = provenanceMap.get(currentLot.provenanceId);
                if (!provenance) {
                     alert('Provenance non trouvée.');
                     return '';
                }

                const region = regionMap.get(provenance.regionId);
                if (!region) {
                    alert('Région de provenance non trouvée.');
                    return '';
                }
                const regionCode = region.code;
                
                const prefix = `${year}-${speciesAbbr}-${regionCode}`;
                let maxSeq = 0;
                lots.forEach(lot => {
                    if (lot.id.startsWith(prefix)) {
                        const seqStr = lot.id.split('-').pop();
                        const seq = seqStr ? parseInt(seqStr, 10) : 0;
                        if (!isNaN(seq) && seq > maxSeq) {
                            maxSeq = seq;
                        }
                    }
                });
                const newSeq = (maxSeq + 1).toString().padStart(3, '0');
    
                return `${prefix}-${newSeq}`;
            };

            const newId = generateNewLotId();
            if (!newId) return; 

            const newLot: Lot = {
                ...currentLot,
                id: newId,
            } as Lot;
            newLots = [newLot, ...lots];
        }

        setData({ ...data, lots: newLots, stockItems: newStockItems });
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
            const newLots = lots.filter(l => l.id !== id);
            // Also remove from stock if it exists there
            const newStockItems = stockItems.filter(item => item.lotId !== id);
            setData({ ...data, lots: newLots, stockItems: newStockItems });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentLot(prev => {
            if (!prev) return null;
            const updatedLot = { ...prev, [name]: value };
            if (name === 'harvestDate' && value) {
                updatedLot.harvestYear = new Date(value).getFullYear();
            }
            return updatedLot;
        });
    };

    const handleGenusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGenus(e.target.value);
        // Reset species if genus changes
        setCurrentLot(prev => prev ? { ...prev, speciesId: '' } : null);
    };

    const columns: Column<Lot>[] = [
        { Header: 'ID Lot', accessor: 'id' },
        { Header: 'Espèce', accessor: (row: Lot) => speciesMap.get(row.speciesId)?.commonName || 'N/A' },
        { Header: 'Peuplement', accessor: 'seedStand'},
        { Header: 'Date Récolte', accessor: 'harvestDate' },
        { Header: 'Quantité (kg)', accessor: 'quantityKg' },
        { Header: 'Prestataire', accessor: (row: Lot) => row.prestataireId ? (prestataireMap.get(row.prestataireId)?.name || 'N/A') : 'N/A' },
        { Header: 'Statut', accessor: 'status', 
            Cell: ({ value }: { value: string }) => {
                const statusColor = {
                    'En stock': 'bg-green-100 text-green-800',
                    'En traitement': 'bg-yellow-100 text-yellow-800',
                    'Distribué': 'bg-blue-100 text-blue-800',
                }[value] || 'bg-slate-100 text-slate-800';
                return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>{value}</span>;
            }
        },
        {
            Header: 'Actions',
            accessor: 'id',
            Cell: ({ row }) => (
                <div className="flex space-x-2">
                    <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Récoltes & Lots</h1>
            <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4 items-end">
                    <div className="sm:col-span-2 lg:col-span-2">
                        <label htmlFor="search" className="block text-sm font-medium text-slate-700">Rechercher</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="ID, espèce, peuplement..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700">Statut</label>
                        <select
                            id="statusFilter"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Tous</option>
                            <option value="En traitement">En traitement</option>
                            <option value="En stock">En stock</option>
                            <option value="Distribué">Distribué</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="categoryFilter" className="block text-sm font-medium text-slate-700">Catégorie</label>
                        <select
                            id="categoryFilter"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Toutes</option>
                            <option value="Récolte">Récolte</option>
                            <option value="Achat">Achat</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-2">
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
                    <div className="sm:col-span-full md:col-span-1 lg:col-span-1">
                        <button 
                            onClick={() => handleOpenModal()}
                            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                            Ajouter un Lot
                        </button>
                    </div>
                </div>
                <Table columns={columns} data={filteredLots} />
            </Card>

            {isModalOpen && currentLot && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentLot.id ? 'Modifier le Lot' : 'Ajouter un Lot'}>
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
                            <select name="speciesId" value={currentLot.speciesId} onChange={handleInputChange} disabled={!selectedGenus} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-50">
                                <option value="">Sélectionner une espèce</option>
                                {selectedGenus && speciesByGenus.get(selectedGenus)?.map(s => <option key={s.id} value={s.id}>{s.commonName}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="seedStand" className="block text-sm font-medium text-slate-700">Peuplement à graine</label>
                            <input type="text" name="seedStand" value={currentLot.seedStand} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="srsId" className="block text-sm font-medium text-slate-700">SRS</label>
                            <select name="srsId" value={currentLot.srsId} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un SRS</option>
                                {data.srs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="provenanceId" className="block text-sm font-medium text-slate-700">Provenance</label>
                            <select name="provenanceId" value={currentLot.provenanceId} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner une provenance</option>
                                {data.provenances.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="prestataireId" className="block text-sm font-medium text-slate-700">Prestataire (si récolte)</label>
                            <select name="prestataireId" value={currentLot.prestataireId} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">N/A</option>
                                {data.prestataires.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="harvestDate" className="block text-sm font-medium text-slate-700">Date de récolte</label>
                            <input type="date" name="harvestDate" value={currentLot.harvestDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="quantityKg" className="block text-sm font-medium text-slate-700">Quantité (kg)</label>
                            <input type="number" name="quantityKg" value={currentLot.quantityKg} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-slate-700">Statut</label>
                            <select name="status" value={currentLot.status} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                               <option>En traitement</option>
                               <option>En stock</option>
                               <option>Distribué</option>
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

export default HarvestAndLotManagement;
