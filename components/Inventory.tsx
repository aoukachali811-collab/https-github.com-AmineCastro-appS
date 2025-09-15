
import React, { useState, useMemo } from 'react';
import type { StockItem, MockData, Species, Srs } from '../types';
import Card from './shared/Card';
import Table from './shared/Table';
import type { Column } from './shared/Table';
import Modal from './shared/Modal';

interface InventoryProps {
    data: MockData;
    setData: (data: MockData) => void;
}

const Inventory: React.FC<InventoryProps> = ({ data, setData }) => {
    const { stockItems, species, srs, lots } = data;
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<StockItem> | null>(null);
    const [selectedGenus, setSelectedGenus] = useState<string>('');
    
    const { speciesMap, srsMap, genera, speciesByGenus } = useMemo(() => {
        const speciesMap = new Map(species.map(s => [s.id, s]));
        const srsMap = new Map(srs.map(s => [s.id, s]));
        const genera = [...new Set(species.map(s => s.genus))].sort();
        const speciesByGenus = new Map<string, Species[]>();
        species.forEach(s => {
            const list = speciesByGenus.get(s.genus) || [];
            list.push(s);
            speciesByGenus.set(s.genus, list);
        });
        return { speciesMap, srsMap, genera, speciesByGenus };
    }, [species, srs]);

    const filteredStockItems = useMemo(() => {
        return stockItems.filter(item => {
            const species = speciesMap.get(item.speciesId);
            const srs = srsMap.get(item.srsId);
            const searchTermLower = searchTerm.toLowerCase();

            const matchesSearchTerm = (
                item.lotId.toLowerCase().includes(searchTermLower) ||
                (species && species.commonName.toLowerCase().includes(searchTermLower)) ||
                (srs && srs.name.toLowerCase().includes(searchTermLower))
            );

            const entry = new Date(item.entryDate);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if(start) start.setHours(0,0,0,0);
            if(end) end.setHours(23, 59, 59, 999);

            const matchesDate = (!start || entry >= start) && (!end || entry <= end);

            return matchesSearchTerm && matchesDate;
        });
    }, [stockItems, searchTerm, startDate, endDate, speciesMap, srsMap]);


    const handleOpenModal = (item: StockItem | null = null) => {
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
        if (!currentItem) return;
        
        let newStockItems: StockItem[];

        if (currentItem.id) {
            // Edit
            newStockItems = stockItems.map(item => item.id === currentItem.id ? currentItem as StockItem : item);
        } else {
            // Add
            const newItem: StockItem = {
                ...currentItem,
                id: `STK-${Date.now()}`,
                entryDate: currentItem.entryDate || new Date().toISOString().split('T')[0],
            } as StockItem;
            newStockItems = [newItem, ...stockItems];
        }
        setData({ ...data, stockItems: newStockItems });
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article du stock ?')) {
            const newStockItems = stockItems.filter(item => item.id !== id);
            setData({ ...data, stockItems: newStockItems });
        }
    };

    const columns: Column<StockItem>[] = [
        { Header: 'ID Lot', accessor: 'lotId' },
        { Header: 'Espèce', accessor: (row: StockItem) => speciesMap.get(row.speciesId)?.commonName || 'N/A' },
        { Header: 'Quantité (kg)', accessor: 'quantityKg' },
        { Header: 'Date d\'Entrée', accessor: 'entryDate' },
        { Header: 'SRS (Emplacement)', accessor: (row: StockItem) => srsMap.get(row.srsId)?.name || 'N/A' },
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
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const handleGenusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGenus(e.target.value);
        setCurrentItem(prev => prev ? { ...prev, speciesId: '' } : null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Inventaire (Stock)</h1>
            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="search" className="sr-only">Rechercher</label>
                         <input
                            id="search"
                            type="text"
                            placeholder="Rechercher par Lot, Espèce, SRS..."
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
                        Nouvelle Entrée
                    </button>
                </div>
                <Table columns={columns} data={filteredStockItems} />
            </Card>

             {isModalOpen && currentItem && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Modifier l\'Entrée' : 'Nouvelle Entrée en Stock'}>
                     <div className="space-y-4">
                        <div>
                            <label htmlFor="lotId" className="block text-sm font-medium text-slate-700">Lot</label>
                            <select name="lotId" value={currentItem.lotId} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un lot</option>
                                {lots.map(l => <option key={l.id} value={l.id}>{l.id}</option>)}
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
                            <select name="speciesId" value={currentItem.speciesId} onChange={handleInputChange} disabled={!selectedGenus} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md disabled:bg-slate-50">
                                <option value="">Sélectionner une espèce</option>
                                {selectedGenus && speciesByGenus.get(selectedGenus)?.map(s => <option key={s.id} value={s.id}>{s.commonName}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="srsId" className="block text-sm font-medium text-slate-700">SRS</label>
                            <select name="srsId" value={currentItem.srsId} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="">Sélectionner un SRS</option>
                                {srs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="quantityKg" className="block text-sm font-medium text-slate-700">Quantité (kg)</label>
                            <input type="number" name="quantityKg" value={currentItem.quantityKg} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="entryDate" className="block text-sm font-medium text-slate-700">Date d'entrée</label>
                            <input type="date" name="entryDate" value={currentItem.entryDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"/>
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

export default Inventory;
